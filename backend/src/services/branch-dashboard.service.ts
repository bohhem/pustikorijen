import prisma from '../utils/prisma';

import type { branch_members } from '@prisma/client';

export async function getPendingCountsForUser(userId: string) {
  const guruMemberships = (await prisma.branchMember.findMany({
    where: {
      user_id: userId,
      role: 'guru',
      status: 'active',
    },
    select: {
      branch_id: true,
    },
  })) as Pick<branch_members, 'branch_id'>[];

  if (guruMemberships.length === 0) {
    return [];
  }

  const branchIds = guruMemberships.map((m) => m.branch_id);

  const result = (await prisma.branchPersonLink.groupBy({
    by: ['branch_id'],
    where: {
      status: 'pending',
      branch_id: { in: branchIds },
    },
    _count: {
      branch_id: true,
    },
  })) as Array<{ branch_id: string; _count: { branch_id: number } }>;

  return result.map((row) => ({ branchId: row.branch_id, pendingLinks: row._count.branch_id }));
}
