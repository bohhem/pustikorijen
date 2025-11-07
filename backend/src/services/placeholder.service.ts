import { randomUUID } from 'crypto';
import prisma from '../utils/prisma';
import { ensureBranchIsActive } from '../utils/branch.guard';
import type { JwtPayload } from '../utils/jwt';
import type { CreatePlaceholderInput, ResolvePlaceholderInput } from '../schemas/placeholder.schema';

type PlaceholderRow = {
  placeholder_id: string;
  branch_id: string;
  display_name: string;
  relation_hint: string | null;
  approx_birth_year: number | null;
  notes: string | null;
  status: string;
  is_public: boolean;
  created_at: Date;
  created_by_user?: { user_id: string; full_name: string } | null;
  geo_city?: { name: string | null } | null;
  claims: { claim_id: string; status: string }[];
};

type PlaceholderClaimRow = {
  claim_id: string;
  placeholder_id: string;
  branch_id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: Date;
  placeholder?: { display_name: string; relation_hint: string | null } | null;
  user?: { user_id: string; full_name: string; email: string | null } | null;
};

function isElevated(user: JwtPayload) {
  return user.globalRole === 'SUPER_GURU' || user.globalRole === 'ADMIN';
}

async function ensureGuruAccess(branchId: string, actor: JwtPayload) {
  await ensureBranchIsActive(branchId);

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
    select: { role: true, status: true },
  });

  if (!membership || membership.role !== 'guru' || membership.status !== 'active') {
    throw new Error('Guru permissions required');
  }
}

export async function listPlaceholders(branchId: string, actor?: JwtPayload) {
  await ensureBranchIsActive(branchId);

  const isGuru = actor ? isElevated(actor) || (await prisma.branchMember.findUnique({
    where: {
      branch_id_user_id: {
        branch_id: branchId,
        user_id: actor.userId,
      },
    },
    select: { role: true, status: true },
  }))?.role === 'guru' : false;

  const placeholders = (await prisma.branchPlaceholder.findMany({
    where: {
      branch_id: branchId,
      ...(isGuru ? {} : { is_public: true }),
    },
    orderBy: [{ created_at: 'desc' }],
    include: {
      created_by_user: {
        select: {
          user_id: true,
          full_name: true,
        },
      },
      geo_city: {
        select: {
          name: true,
        },
      },
      claims: {
        select: {
          claim_id: true,
          status: true,
        },
      },
    },
  })) as PlaceholderRow[];

  return placeholders.map((placeholder) => ({
    id: placeholder.placeholder_id,
    displayName: placeholder.display_name,
    relationHint: placeholder.relation_hint,
    approxBirthYear: placeholder.approx_birth_year,
    notes: placeholder.notes,
    status: placeholder.status,
    isPublic: placeholder.is_public,
    cityName: placeholder.geo_city?.name,
    createdAt: placeholder.created_at,
    createdBy: placeholder.created_by_user ? {
      id: placeholder.created_by_user.user_id,
      name: placeholder.created_by_user.full_name,
    } : undefined,
    claimCount: placeholder.claims.length,
  }));
}

export async function createPlaceholder(branchId: string, actor: JwtPayload, input: CreatePlaceholderInput) {
  await ensureGuruAccess(branchId, actor);

  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
    select: { geo_city_id: true },
  });

  const placeholder = await prisma.branchPlaceholder.create({
    data: {
      placeholder_id: randomUUID(),
      branch_id: branchId,
      created_by: actor.userId,
      display_name: input.displayName,
      relation_hint: input.relationHint ?? null,
      approx_birth_year: input.approxBirthYear ?? null,
      notes: input.notes ?? null,
      is_public: input.isPublic ?? true,
      geo_city_id: branch?.geo_city_id ?? null,
    },
  });

  return placeholder.placeholder_id;
}

export async function claimPlaceholder(branchId: string, placeholderId: string, actor: JwtPayload, message?: string | null) {
  await ensureBranchIsActive(branchId);

  const placeholder = await prisma.branchPlaceholder.findUnique({
    where: { placeholder_id: placeholderId },
    select: {
      placeholder_id: true,
      branch_id: true,
      is_public: true,
    },
  });

  if (!placeholder || placeholder.branch_id !== branchId) {
    throw new Error('Placeholder not found');
  }

  if (!placeholder.is_public && !isElevated(actor)) {
    const membership = await prisma.branchMember.findUnique({
      where: {
        branch_id_user_id: {
          branch_id: branchId,
          user_id: actor.userId,
        },
      },
      select: { role: true, status: true },
    });
    if (!membership || membership.status !== 'active') {
      throw new Error('You do not have access to this placeholder');
    }
  }

  const existing = await prisma.branchPlaceholderClaim.findFirst({
    where: {
      placeholder_id: placeholderId,
      user_id: actor.userId,
      status: 'pending',
    },
  });

  if (existing) {
    throw new Error('You already have a pending claim for this placeholder');
  }

  await prisma.branchPlaceholderClaim.create({
    data: {
      claim_id: randomUUID(),
      branch_id: branchId,
      placeholder_id: placeholderId,
      user_id: actor.userId,
      message: message ?? null,
    },
  });
}

export async function listPlaceholderClaims(branchId: string, actor: JwtPayload) {
  await ensureGuruAccess(branchId, actor);

  const claims = (await prisma.branchPlaceholderClaim.findMany({
    where: { branch_id: branchId },
    orderBy: [{ created_at: 'desc' }],
    include: {
      placeholder: {
        select: {
          placeholder_id: true,
          display_name: true,
          relation_hint: true,
        },
      },
      user: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  })) as PlaceholderClaimRow[];

  return claims.map((claim) => ({
    id: claim.claim_id,
    placeholderId: claim.placeholder_id,
    placeholderName: claim.placeholder?.display_name ?? '',
    relationHint: claim.placeholder?.relation_hint ?? undefined,
    user: claim.user
      ? {
          id: claim.user.user_id,
          name: claim.user.full_name,
          email: claim.user.email ?? undefined,
        }
      : undefined,
    message: claim.message ?? undefined,
    status: claim.status,
    createdAt: claim.created_at,
  }));
}

export async function resolvePlaceholderClaim(
  branchId: string,
  claimId: string,
  actor: JwtPayload,
  input: ResolvePlaceholderInput
) {
  await ensureGuruAccess(branchId, actor);

  const claim = await prisma.branchPlaceholderClaim.findUnique({
    where: { claim_id: claimId },
    include: { placeholder: true },
  });

  if (!claim || claim.branch_id !== branchId) {
    throw new Error('Claim not found');
  }

  if (claim.status !== 'pending') {
    throw new Error('Claim already resolved');
  }

  await prisma.$transaction([
    prisma.branchPlaceholderClaim.update({
      where: { claim_id: claimId },
      data: {
        status: input.status,
        resolved_by: actor.userId,
        resolved_at: new Date(),
        message: input.message ?? claim.message,
      },
    }),
    input.status === 'approved'
      ? prisma.branchPlaceholder.update({
          where: { placeholder_id: claim.placeholder_id },
          data: {
            status: 'claimed',
            is_public: false,
          },
        })
      : prisma.branchPlaceholder.update({
          where: { placeholder_id: claim.placeholder_id },
          data: {
            status: 'open',
          },
        }),
  ]);
}
