import { randomUUID } from 'crypto';
import type { branch_person_links as BranchPersonLink } from '@prisma/client';
import prisma from '../utils/prisma';
import type { JwtPayload } from '../utils/jwt';

type ActingUser = Pick<JwtPayload, 'userId' | 'globalRole'>;

const LINK_APPROVED_STATUS = 'approved';
const LINK_REJECTED_STATUS = 'rejected';
const PENDING_STATUSES = ['pending'] as const;

function formatLink(link: {
  link_id: string;
  person_id: string;
  branch_id: string;
  source_branch_id: string;
  status: string;
  display_name: string | null;
  notes: string | null;
  requested_by: string;
  source_approved_by: string | null;
  source_approved_at: Date | null;
  target_approved_by: string | null;
  target_approved_at: Date | null;
  is_primary_bridge?: boolean;
  primary_set_at?: Date | null;
  display_generation_override?: number | null;
  created_at: Date;
  updated_at: Date;
  persons: {
    person_id: string;
    full_name: string;
    given_name: string | null;
    surname: string | null;
    maiden_name: string | null;
    birth_date: Date | null;
    death_date: Date | null;
    family_branches?: {
      branch_id: string;
      surname: string;
      city_name: string | null;
    } | null;
  };
  users_branch_person_links_requested_byTousers?: {
    user_id: string;
    full_name: string;
    email: string | null;
  } | null;
}) {
  return {
    id: link.link_id,
    status: link.status,
    requestedBy: link.users_branch_person_links_requested_byTousers
      ? {
          id: link.users_branch_person_links_requested_byTousers.user_id,
          fullName: link.users_branch_person_links_requested_byTousers.full_name,
          email: link.users_branch_person_links_requested_byTousers.email,
        }
      : { id: link.requested_by, fullName: null, email: null },
    displayName: link.display_name,
    notes: link.notes,
    createdAt: link.created_at,
    updatedAt: link.updated_at,
    displayGenerationOverride: link.display_generation_override ?? null,
    isPrimary: link.is_primary_bridge,
    primaryAssignedAt: link.primary_set_at,
    sourceBranchId: link.source_branch_id,
    targetBranchId: link.branch_id,
    sourceApprovedBy: link.source_approved_by,
    sourceApprovedAt: link.source_approved_at,
    targetApprovedBy: link.target_approved_by,
    targetApprovedAt: link.target_approved_at,
    person: {
      id: link.persons.person_id,
      fullName: link.persons.full_name,
      givenName: link.persons.given_name,
      surname: link.persons.surname,
      maidenName: link.persons.maiden_name,
      birthDate: link.persons.birth_date,
      deathDate: link.persons.death_date,
      homeBranch: link.persons.family_branches
        ? {
            id: link.persons.family_branches.branch_id,
            surname: link.persons.family_branches.surname,
            cityName: link.persons.family_branches.city_name,
          }
        : null,
    },
  };
}

async function ensureGuru(branchId: string, userId: string): Promise<void> {
  const membership = await prisma.branchMember.findUnique({
    where: {
      branch_id_user_id: {
        branch_id: branchId,
        user_id: userId,
      },
    },
    select: {
      role: true,
      status: true,
    },
  });

  if (!membership || membership.role !== 'guru' || membership.status !== 'active') {
    throw new Error('Only branch Gurus can perform this action');
  }
}

export async function searchPersonsForLink(branchId: string, query?: string, limit = 20) {
  const targetBranch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
    select: {
      branch_id: true,
      surname: true,
      admin_region_id: true,
    },
  });

  if (!targetBranch) {
    throw new Error('Branch not found');
  }

  const persons = (await prisma.person.findMany({
    where: {
      branch_id: {
        not: branchId,
      },
      ...(targetBranch.admin_region_id
        ? {
            family_branches: {
              admin_region_id: targetBranch.admin_region_id,
            },
          }
        : {}),
      ...(query
        ? {
            full_name: {
              contains: query,
              mode: 'insensitive',
            },
          }
        : {}),
      branch_person_links: {
        none: {
          branch_id: branchId,
          status: {
            not: LINK_REJECTED_STATUS,
          },
        },
      },
    },
    include: {
      family_branches: {
        select: {
          branch_id: true,
          surname: true,
          city_name: true,
          admin_region_id: true,
        },
      },
    },
    orderBy: {
      full_name: 'asc',
    },
    take: limit,
  })) as Array<{
    person_id: string;
    full_name: string;
    given_name: string | null;
    surname: string | null;
    maiden_name: string | null;
    birth_date: Date | null;
    death_date: Date | null;
    family_branches: {
      branch_id: string;
      surname: string;
      city_name: string | null;
    } | null;
  }>;

  return persons.map((person) => ({
    id: person.person_id,
    fullName: person.full_name,
    givenName: person.given_name,
    surname: person.surname,
    maidenName: person.maiden_name,
    birthDate: person.birth_date,
    deathDate: person.death_date,
    homeBranch: person.family_branches
      ? {
          id: person.family_branches.branch_id,
          surname: person.family_branches.surname,
          cityName: person.family_branches.city_name,
        }
      : null,
  }));
}

export async function requestPersonLink(params: {
  branchId: string;
  personId: string;
  requestedBy: string;
  displayName?: string | null;
  notes?: string | null;
}) {
  const { branchId, personId, requestedBy, displayName, notes } = params;

  const [targetBranch, person] = await Promise.all([
    prisma.familyBranch.findUnique({
      where: { branch_id: branchId },
      select: { branch_id: true, admin_region_id: true, surname: true },
    }),
    prisma.person.findUnique({
      where: { person_id: personId },
      include: {
        family_branches: {
          select: {
            branch_id: true,
            surname: true,
            admin_region_id: true,
          },
        },
        branch_person_links: {
          where: {
            branch_id: branchId,
            status: {
              not: LINK_REJECTED_STATUS,
            },
          },
          select: {
            link_id: true,
            status: true,
          },
        },
      },
    }),
  ]);

  if (!targetBranch) {
    throw new Error('Branch not found');
  }

  if (!person || !person.family_branches) {
    throw new Error('Person not found');
  }

  if (person.branch_id === branchId) {
    throw new Error('Person already belongs to this branch');
  }

  if (
    targetBranch.admin_region_id &&
    person.family_branches.admin_region_id &&
    targetBranch.admin_region_id !== person.family_branches.admin_region_id
  ) {
    throw new Error('Person belongs to a different region');
  }

  // Check for existing link to target branch
  if (person.branch_person_links.length > 0) {
    const existing = person.branch_person_links[0];
    if (existing.status === LINK_APPROVED_STATUS || PENDING_STATUSES.includes(existing.status as typeof PENDING_STATUSES[number])) {
      throw new Error('A link request already exists for this person and branch');
    }
  }

  // Check for reverse link (from target branch to source branch)
  const reverseLink = await prisma.branchPersonLink.findFirst({
    where: {
      person_id: personId,
      branch_id: person.family_branches.branch_id,
      source_branch_id: branchId,
      status: {
        not: LINK_REJECTED_STATUS,
      },
    },
  });

  if (reverseLink) {
    throw new Error('A link request already exists in the opposite direction for this person and these branches');
  }

  const link = await prisma.branchPersonLink.create({
    data: {
      link_id: randomUUID(),
      person_id: personId,
      branch_id: branchId,
      source_branch_id: person.family_branches.branch_id,
      status: 'pending',
      display_name: displayName ?? null,
      notes: notes ?? null,
      requested_by: requestedBy,
    },
    include: {
      persons: {
        select: {
          person_id: true,
          full_name: true,
          given_name: true,
          surname: true,
          maiden_name: true,
          birth_date: true,
          death_date: true,
          branch_id: true,
          family_branches: {
            select: {
              branch_id: true,
              surname: true,
              city_name: true,
            },
          },
        },
      },
      users_branch_person_links_requested_byTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  return formatLink(link);
}

export async function listPersonLinks(params: { branchId: string; status?: string | null; includeSource?: boolean }) {
  const { branchId, status } = params;

  const links = (await prisma.branchPersonLink.findMany({
    where: {
      OR: [{ branch_id: branchId }, { source_branch_id: branchId }],
      ...(status ? { status } : {}),
    },
    include: {
      persons: {
        select: {
          person_id: true,
          full_name: true,
          given_name: true,
          surname: true,
          maiden_name: true,
          birth_date: true,
          death_date: true,
          branch_id: true,
          family_branches: {
            select: {
              branch_id: true,
              surname: true,
              city_name: true,
            },
          },
        },
      },
      users_branch_person_links_requested_byTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  })) as Array<{
    link_id: string;
    person_id: string;
    branch_id: string;
    source_branch_id: string;
    status: string;
    display_name: string | null;
    notes: string | null;
    requested_by: string;
    source_approved_by: string | null;
    source_approved_at: Date | null;
    target_approved_by: string | null;
    target_approved_at: Date | null;
    created_at: Date;
    updated_at: Date;
    display_generation_override: number | null;
    persons: {
      person_id: string;
      full_name: string;
      given_name: string | null;
      surname: string | null;
      maiden_name: string | null;
      birth_date: Date | null;
      death_date: Date | null;
      branch_id: string;
      family_branches: {
        branch_id: string;
        surname: string;
        city_name: string | null;
      } | null;
    };
    users_branch_person_links_requested_byTousers?: {
      user_id: string;
      full_name: string;
      email: string | null;
    } | null;
  }>;

  return links.map((link) => formatLink(link));
}

function hasAlreadyApproved(link: BranchPersonLink, branchId: string, userId: string) {
  if (link.source_branch_id === branchId && link.source_approved_by === userId) {
    return true;
  }
  if (link.branch_id === branchId && link.target_approved_by === userId) {
    return true;
  }
  return false;
}

export async function approvePersonLink(params: {
  linkId: string;
  branchId: string;
  actor: ActingUser;
}) {
  const { linkId, branchId, actor } = params;

  const link = await prisma.branchPersonLink.findUnique({
    where: { link_id: linkId },
    include: {
      persons: {
        select: {
          person_id: true,
          full_name: true,
          branch_id: true,
        },
      },
    },
  });

  if (!link) {
    throw new Error('Link not found');
  }

  const isSourceBranch = link.source_branch_id === branchId;
  const isTargetBranch = link.branch_id === branchId;

  if (!isSourceBranch && !isTargetBranch) {
    throw new Error('Branch not authorized to approve this link');
  }

  await ensureGuru(branchId, actor.userId);

  if (hasAlreadyApproved(link, branchId, actor.userId)) {
    throw new Error('Already approved this link from this branch');
  }

  const updateData: Record<string, unknown> = {};

  if (link.status === LINK_REJECTED_STATUS) {
    throw new Error('Link has already been rejected');
  }

  if (isSourceBranch) {
    updateData.source_approved_by = actor.userId;
    updateData.source_approved_at = new Date();
  }

  if (isTargetBranch) {
    updateData.target_approved_by = actor.userId;
    updateData.target_approved_at = new Date();
  }

  const updated = await prisma.branchPersonLink.update({
    where: { link_id: linkId },
    data: {
      ...updateData,
      status:
        (isSourceBranch && (link.target_approved_by || updateData.target_approved_by)) ||
        (isTargetBranch && (link.source_approved_by || updateData.source_approved_by))
          ? LINK_APPROVED_STATUS
          : link.status,
    },
    include: {
      persons: {
        select: {
          person_id: true,
          full_name: true,
          given_name: true,
          surname: true,
          maiden_name: true,
          birth_date: true,
          death_date: true,
          branch_id: true,
          family_branches: {
            select: {
              branch_id: true,
              surname: true,
              city_name: true,
            },
          },
        },
      },
      users_branch_person_links_requested_byTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  return formatLink(updated);
}

export async function rejectPersonLink(params: {
  linkId: string;
  branchId: string;
  actor: ActingUser;
  notes?: string | null;
}) {
  const { linkId, branchId, actor, notes } = params;

  const link = await prisma.branchPersonLink.findUnique({
    where: { link_id: linkId },
  });

  if (!link) {
    throw new Error('Link not found');
  }

  const isSourceBranch = link.source_branch_id === branchId;
  const isTargetBranch = link.branch_id === branchId;

  if (!isSourceBranch && !isTargetBranch) {
    throw new Error('Branch not authorized to reject this link');
  }

  await ensureGuru(branchId, actor.userId);

  const updated = await prisma.branchPersonLink.update({
    where: { link_id: linkId },
    data: {
      status: LINK_REJECTED_STATUS,
      notes: notes ?? link.notes,
      source_approved_by: isSourceBranch ? actor.userId : link.source_approved_by,
      source_approved_at: isSourceBranch ? new Date() : link.source_approved_at,
      target_approved_by: isTargetBranch ? actor.userId : link.target_approved_by,
      target_approved_at: isTargetBranch ? new Date() : link.target_approved_at,
    },
    include: {
      persons: {
        select: {
          person_id: true,
          full_name: true,
          given_name: true,
          surname: true,
          maiden_name: true,
          birth_date: true,
          death_date: true,
          branch_id: true,
          family_branches: {
            select: {
              branch_id: true,
              surname: true,
              city_name: true,
            },
          },
        },
      },
      users_branch_person_links_requested_byTousers: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  return formatLink(updated);
}

function ensureSuperGuru(actor: ActingUser) {
  if (actor.globalRole !== 'SUPER_GURU' && actor.globalRole !== 'ADMIN') {
    throw new Error('Only SuperGurus can manage primary bridges');
  }
}

function buildPairWhere(branchA: string, branchB: string) {
  return {
    OR: [
      { branch_id: branchA, source_branch_id: branchB },
      { branch_id: branchB, source_branch_id: branchA },
    ],
  };
}

export interface BridgeIssueLinkSummary {
  id: string;
  status: string;
  isPrimary: boolean;
  sourceBranchId: string;
  targetBranchId: string;
  displayName: string | null;
  notes: string | null;
  approvedAt: Date | null;
  primaryAssignedAt: Date | null;
  displayGenerationOverride: number | null;
  person: {
    id: string;
    fullName: string;
    generation: string | null;
    generationNumber: number | null;
  };
}

export interface BridgeIssueSummary {
  pairId: string;
  branchA: {
    id: string;
    surname: string;
    cityName: string | null;
    region: string | null;
    country: string | null;
  };
  branchB: {
    id: string;
    surname: string;
    cityName: string | null;
    region: string | null;
    country: string | null;
  };
  totalLinks: number;
  hasPrimary: boolean;
  primaryLinkId: string | null;
  links: BridgeIssueLinkSummary[];
}

export async function getBridgeIssues(): Promise<BridgeIssueSummary[]> {
  const links = await prisma.branchPersonLink.findMany({
    where: {
      status: {
        in: ['pending', 'approved'],
      },
    },
    include: {
      persons: {
        select: {
          person_id: true,
          full_name: true,
          generation: true,
          generation_number: true,
        },
      },
    },
    orderBy: {
      created_at: 'asc',
    },
  });

  if (links.length === 0) {
    return [];
  }

  const branchIds = new Set<string>();
  for (const link of links) {
    branchIds.add(link.branch_id);
    branchIds.add(link.source_branch_id);
  }

  const branches = (await prisma.familyBranch.findMany({
    where: {
      branch_id: {
        in: Array.from(branchIds),
      },
    },
    select: {
      branch_id: true,
      surname: true,
      city_name: true,
      region: true,
      country: true,
    },
  })) as Array<{
    branch_id: string;
    surname: string;
    city_name: string | null;
    region: string | null;
    country: string | null;
  }>;

  const branchMeta = new Map<string, {
    id: string;
    surname: string;
    cityName: string | null;
    region: string | null;
    country: string | null;
  }>(
    branches.map((branch) => [
      branch.branch_id,
      {
        id: branch.branch_id,
        surname: branch.surname,
        cityName: branch.city_name,
        region: branch.region,
        country: branch.country,
      },
    ])
  );

  const grouped = new Map<
    string,
    {
      branchAId: string;
      branchBId: string;
      links: BridgeIssueLinkSummary[];
    }
  >();

  for (const link of links) {
    const [branchAId, branchBId] =
      link.branch_id < link.source_branch_id
        ? [link.branch_id, link.source_branch_id]
        : [link.source_branch_id, link.branch_id];

    const pairKey = `${branchAId}::${branchBId}`;

    if (!grouped.has(pairKey)) {
      grouped.set(pairKey, {
        branchAId,
        branchBId,
        links: [],
      });
    }

    grouped.get(pairKey)!.links.push({
      id: link.link_id,
      status: link.status,
      isPrimary: link.is_primary_bridge,
      sourceBranchId: link.source_branch_id,
      targetBranchId: link.branch_id,
      displayName: link.display_name,
      notes: link.notes,
      approvedAt:
        link.status === LINK_APPROVED_STATUS
          ? link.target_approved_at ?? link.source_approved_at ?? link.updated_at
          : null,
      primaryAssignedAt: link.primary_set_at,
      displayGenerationOverride: link.display_generation_override,
      person: {
        id: link.person_id,
        fullName: link.persons.full_name,
        generation: link.persons.generation,
        generationNumber: link.persons.generation_number,
      },
    });
  }

  const summaries: BridgeIssueSummary[] = [];

  for (const [pairId, payload] of grouped.entries()) {
    const branchA = branchMeta.get(payload.branchAId);
    const branchB = branchMeta.get(payload.branchBId);

    if (!branchA || !branchB) {
      continue;
    }

    const approvedOrPendingLinks = payload.links.filter((link) => link.status !== LINK_REJECTED_STATUS);
    if (approvedOrPendingLinks.length <= 1) {
      continue;
    }

    const hasPrimary = approvedOrPendingLinks.some((link) => link.isPrimary);
    const primaryLink = approvedOrPendingLinks.find((link) => link.isPrimary) ?? null;

    summaries.push({
      pairId,
      branchA,
      branchB,
      totalLinks: approvedOrPendingLinks.length,
      hasPrimary,
      primaryLinkId: primaryLink?.id ?? null,
      links: approvedOrPendingLinks.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        if (a.status === LINK_APPROVED_STATUS && b.status !== LINK_APPROVED_STATUS) return -1;
        if (a.status !== LINK_APPROVED_STATUS && b.status === LINK_APPROVED_STATUS) return 1;
        return a.person.fullName.localeCompare(b.person.fullName);
      }),
    });
  }

  return summaries.sort((a, b) => b.totalLinks - a.totalLinks);
}

export async function setPrimaryBridge(linkId: string, actor: ActingUser) {
  ensureSuperGuru(actor);

  return prisma.$transaction(async (tx: typeof prisma) => {
    const link = await tx.branchPersonLink.findUnique({
      where: { link_id: linkId },
      include: {
        persons: {
          select: {
            person_id: true,
            full_name: true,
            generation: true,
            generation_number: true,
          },
        },
      },
    });

    if (!link) {
      throw new Error('Link not found');
    }

    const pairWhere = buildPairWhere(link.branch_id, link.source_branch_id);

    await tx.branchPersonLink.updateMany({
      where: pairWhere,
      data: {
        is_primary_bridge: false,
        primary_set_at: null,
        primary_set_by: null,
      },
    });

    const updated = await tx.branchPersonLink.update({
      where: { link_id: linkId },
      data: {
        is_primary_bridge: true,
        primary_set_at: new Date(),
        primary_set_by: actor.userId,
      },
      include: {
        persons: {
          select: {
            person_id: true,
            full_name: true,
            given_name: true,
            surname: true,
            maiden_name: true,
            birth_date: true,
            death_date: true,
            family_branches: {
              select: {
                branch_id: true,
                surname: true,
                city_name: true,
              },
            },
          },
        },
        users_branch_person_links_requested_byTousers: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return formatLink(updated);
  });
}

export async function clearPrimaryBridge(linkId: string, actor: ActingUser) {
  ensureSuperGuru(actor);

  const link = await prisma.branchPersonLink.findUnique({
    where: { link_id: linkId },
  });

  if (!link) {
    throw new Error('Link not found');
  }

  await prisma.branchPersonLink.update({
    where: { link_id: linkId },
    data: {
      is_primary_bridge: false,
      primary_set_at: null,
      primary_set_by: null,
    },
  });
}

export async function superGuruRejectBridge(linkId: string, actor: ActingUser, reason?: string | null) {
  ensureSuperGuru(actor);

  const link = await prisma.branchPersonLink.findUnique({
    where: { link_id: linkId },
  });

  if (!link) {
    throw new Error('Link not found');
  }

  if (link.is_primary_bridge) {
    throw new Error('Cannot reject a primary bridge. Clear the primary status first.');
  }

  await prisma.branchPersonLink.update({
    where: { link_id: linkId },
    data: {
      status: LINK_REJECTED_STATUS,
      notes: reason ?? link.notes,
      is_primary_bridge: false,
      primary_set_at: null,
      primary_set_by: null,
      display_generation_override: null,
      updated_at: new Date(),
    },
  });
}

export async function superGuruUpdateBridgeGeneration(
  linkId: string,
  actor: ActingUser,
  generationNumber: number | null,
): Promise<void> {
  ensureSuperGuru(actor);

  const link = await prisma.branchPersonLink.findUnique({
    where: { link_id: linkId },
  });

  if (!link) {
    throw new Error('Link not found');
  }

  if (link.status === LINK_REJECTED_STATUS) {
    throw new Error('Cannot set generation on a rejected bridge');
  }

  if (generationNumber !== null) {
    if (!Number.isInteger(generationNumber) || generationNumber < 1 || generationNumber > 30) {
      throw new Error('Generation override must be between 1 and 30');
    }
  }

  await prisma.branchPersonLink.update({
    where: { link_id: linkId },
    data: {
      display_generation_override: generationNumber,
      updated_at: new Date(),
    },
  });
}
