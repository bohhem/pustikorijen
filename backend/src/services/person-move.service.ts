import type { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { ensureBranchIsActive } from '../utils/branch.guard';
import type { JwtPayload } from '../utils/jwt';

interface MovePersonParams {
  sourceBranchId: string;
  targetBranchId: string;
  personId: string;
  actor: JwtPayload;
  notes?: string | null;
}

export async function movePersonToBranch({ sourceBranchId, targetBranchId, personId, actor, notes }: MovePersonParams) {
  if (sourceBranchId === targetBranchId) {
    throw new Error('Source and target branches must differ');
  }

  await ensureCanModerate(sourceBranchId, actor);
  await ensureBranchIsActive(targetBranchId);

  const targetBranchGuruCount = await prisma.branchMember.count({
    where: {
      branch_id: targetBranchId,
      role: 'guru',
      status: 'active',
    },
  });

  if (targetBranchGuruCount === 0) {
    throw new Error('Target branch has no active Guru');
  }

  const targetBranch = await prisma.familyBranch.findUnique({
    where: { branch_id: targetBranchId },
    select: { branch_id: true, surname: true },
  });

  if (!targetBranch) {
    throw new Error('Target branch not found');
  }

  const person = await prisma.person.findUnique({
    where: { person_id: personId },
    select: { branch_id: true, full_name: true },
  });

  if (!person || person.branch_id !== sourceBranchId) {
    throw new Error('Person does not belong to this branch');
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedPerson = await tx.persons.update({
      where: { person_id: personId },
      data: {
        branch_id: targetBranchId,
      },
      select: {
        person_id: true,
        branch_id: true,
        full_name: true,
      },
    });

    await tx.audit_log.create({
      data: {
        audit_id: `move-${personId}-${Date.now()}`,
        entity_type: 'person',
        entity_id: personId,
        action_type: 'move_branch',
        branch_id: sourceBranchId,
        new_value: targetBranchId,
        old_value: sourceBranchId,
        user_id: actor.userId,
        reason: notes ?? undefined,
      },
    });

    return updatedPerson;
  });

  return result;
}

async function ensureCanModerate(branchId: string, actor: JwtPayload) {
  await ensureBranchIsActive(branchId);

  if (actor.globalRole === 'SUPER_GURU' || actor.globalRole === 'ADMIN') {
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
