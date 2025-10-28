import { randomUUID } from 'crypto';
import prisma from '../utils/prisma';
import type { JwtPayload } from '../utils/jwt';

export type PersonClaimStatus = 'pending' | 'approved' | 'rejected';

interface PersonClaimRecord {
  claim_id: string;
  branch_id: string;
  person_id: string;
  user_id: string;
  message: string | null;
  status: string;
  resolution_notes: string | null;
  resolved_at: Date | null;
  resolved_by: string | null;
  created_at: Date;
  updated_at: Date;
  user: {
    user_id: string;
    full_name: string;
    email: string | null;
  };
  person: {
    person_id: string;
    full_name: string;
    given_name: string | null;
    surname: string | null;
  };
}

export interface PersonClaimDto {
  id: string;
  personId: string;
  branchId: string;
  user: {
    id: string;
    fullName: string;
    email?: string | null;
  };
  message?: string | null;
  status: PersonClaimStatus;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  notes?: string | null;
  personName: string;
}

function isElevated(actor: JwtPayload | undefined | null) {
  return actor?.globalRole === 'SUPER_GURU' || actor?.globalRole === 'ADMIN';
}

async function ensureGuru(branchId: string, actor: JwtPayload) {
  if (isElevated(actor)) {
    return;
  }

  const membership = await prisma.branchMember.findUnique({
    where: {
      branch_id_user_id: {
        branch_id: branchId,
        user_id: actor.userId,
      },
    },
    select: {
      role: true,
      status: true,
    },
  });

  if (!membership || membership.role !== 'guru' || membership.status !== 'active') {
    throw new Error('Guru permissions required');
  }
}

function mapClaim(record: PersonClaimRecord): PersonClaimDto {
  return {
    id: record.claim_id,
    personId: record.person_id,
    branchId: record.branch_id,
    user: {
      id: record.user.user_id,
      fullName: record.user.full_name,
      email: record.user.email,
    },
    message: record.message ?? undefined,
    status: record.status as PersonClaimStatus,
    createdAt: record.created_at.toISOString(),
    resolvedAt: record.resolved_at ? record.resolved_at.toISOString() : null,
    resolvedBy: record.resolved_by ?? undefined,
    notes: record.resolution_notes ?? undefined,
    personName:
      record.person.full_name ||
      `${record.person.given_name ?? ''} ${record.person.surname ?? ''}`.trim(),
  };
}

export async function submitPersonClaim(params: {
  branchId: string;
  personId: string;
  actor: JwtPayload;
  message?: string | null;
}): Promise<PersonClaimDto> {
  const { branchId, personId, actor, message } = params;

  const person = await prisma.person.findFirst({
    where: {
      person_id: personId,
      branch_id: branchId,
    },
    select: {
      person_id: true,
    },
  });

  if (!person) {
    throw new Error('Person not found');
  }

  const pendingClaim = await prisma.personClaim.findFirst({
    where: {
      person_id: personId,
      status: 'pending',
    },
  });

  if (pendingClaim) {
    throw new Error('This person already has a pending claim');
  }

  const hasCrossBranchLink = await prisma.branchPersonLink.count({
    where: {
      person_id: personId,
      status: 'approved',
    },
  });

  if (hasCrossBranchLink > 0) {
    throw new Error('Person is linked to another branch and cannot be claimed');
  }

  const claim = (await prisma.personClaim.create({
    data: {
      claim_id: randomUUID(),
      branch_id: branchId,
      person_id: personId,
      user_id: actor.userId,
      message: message ?? null,
    },
    include: {
      user: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
      person: {
        select: {
          person_id: true,
          full_name: true,
          given_name: true,
          surname: true,
        },
      },
    },
  })) as PersonClaimRecord;

  return mapClaim(claim);
}

export async function listPersonClaims(branchId: string, actor: JwtPayload): Promise<PersonClaimDto[]> {
  await ensureGuru(branchId, actor);

  const claims = (await prisma.personClaim.findMany({
    where: {
      branch_id: branchId,
      status: 'pending',
    },
    orderBy: {
      created_at: 'asc',
    },
    include: {
      user: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
      person: {
        select: {
          person_id: true,
          full_name: true,
          given_name: true,
          surname: true,
        },
      },
    },
  })) as PersonClaimRecord[];

  return claims.map(mapClaim);
}

export async function resolvePersonClaim(params: {
  branchId: string;
  claimId: string;
  status: PersonClaimStatus;
  notes?: string | null;
  actor: JwtPayload;
}): Promise<PersonClaimDto> {
  const { branchId, claimId, status, notes, actor } = params;

  if (status !== 'approved' && status !== 'rejected') {
    throw new Error('Invalid status');
  }

  await ensureGuru(branchId, actor);

  const claim = await prisma.personClaim.findFirst({
    where: {
      claim_id: claimId,
      branch_id: branchId,
    },
    include: {
      user: true,
      person: true,
    },
  });

  if (!claim) {
    throw new Error('Claim not found');
  }

  if (claim.status !== 'pending') {
    throw new Error('Claim has already been processed');
  }

  const updated = (await prisma.personClaim.update({
    where: {
      claim_id: claimId,
    },
    data: {
      status,
      resolution_notes: notes ?? null,
      resolved_at: new Date(),
      resolved_by: actor.userId,
    },
    include: {
      user: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
      person: {
        select: {
          person_id: true,
          full_name: true,
          given_name: true,
          surname: true,
        },
      },
    },
  })) as PersonClaimRecord;

  if (status === 'approved') {
    const branch = await prisma.familyBranch.findUnique({
      where: {
        branch_id: branchId,
      },
      select: {
        founded_by: true,
      },
    });

    const existingMember = await prisma.branchMember.findUnique({
      where: {
        branch_id_user_id: {
          branch_id: branchId,
          user_id: claim.user_id,
        },
      },
      select: {
        status: true,
        approved_by: true,
        approved_at: true,
        role: true,
      },
    });

    if (existingMember) {
      const now = new Date();
      const updateData: Record<string, unknown> = {
        updated_at: now,
      };

      if (existingMember.status !== 'active') {
        updateData.status = 'active';
      }

      if (!existingMember.approved_by) {
        updateData.approved_by = actor.userId;
      }

      if (!existingMember.approved_at) {
        updateData.approved_at = now;
      }

      if (existingMember.role !== 'guru' && branch?.founded_by === claim.user_id) {
        updateData.role = 'guru';
      }

      await prisma.branchMember.update({
        where: {
          branch_id_user_id: {
            branch_id: branchId,
            user_id: claim.user_id,
          },
        },
        data: updateData,
      });
    } else {
      await prisma.branchMember.create({
        data: {
          member_id: randomUUID(),
          branch_id: branchId,
          user_id: claim.user_id,
          role: branch?.founded_by === claim.user_id ? 'guru' : 'member',
          status: 'active',
          joined_at: new Date(),
          updated_at: new Date(),
          approved_by: actor.userId,
          approved_at: new Date(),
        },
      });
    }
  }

  return mapClaim(updated);
}
