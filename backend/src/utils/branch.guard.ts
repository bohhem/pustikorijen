import prisma from './prisma';

export async function ensureBranchIsActive(branchId: string) {
  const branch = await prisma.familyBranch.findUnique({
    where: { branch_id: branchId },
    select: {
      branch_id: true,
      archived_at: true,
    },
  });

  if (!branch || branch.archived_at) {
    throw new Error('Branch not found');
  }
}
