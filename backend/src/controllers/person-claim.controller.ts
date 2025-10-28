import { Request, Response } from 'express';
import { createPersonClaimSchema, resolvePersonClaimSchema } from '../schemas/person-claim.schema';
import { submitPersonClaim, listPersonClaims, resolvePersonClaim } from '../services/person-claim.service';
import { getErrorMessage, isZodError } from '../utils/error.util';

export async function createPersonClaimController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { branchId, personId } = req.params;
    const payload = createPersonClaimSchema.parse(req.body);

    const claim = await submitPersonClaim({
      branchId,
      personId,
      actor: req.user,
      message: payload.message ?? null,
    });

    res.status(201).json({ claim });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error) || 'Failed to create claim';
    res.status(400).json({ error: message });
  }
}

export async function listPersonClaimsController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id: branchId } = req.params;
    const claims = await listPersonClaims(branchId, req.user);
    res.json({ claims });
  } catch (error: unknown) {
    const message = getErrorMessage(error) || 'Failed to fetch person claims';
    if (message.includes('Guru')) {
      res.status(403).json({ error: message });
      return;
    }
    if (message === 'Branch not found') {
      res.status(404).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}

export async function resolvePersonClaimController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id: branchId, claimId } = req.params;
    const payload = resolvePersonClaimSchema.parse(req.body);

    const claim = await resolvePersonClaim({
      branchId,
      claimId,
      actor: req.user,
      status: payload.status,
      notes: payload.notes ?? null,
    });

    res.json({ claim });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error) || 'Failed to resolve claim';
    if (message.includes('Guru')) {
      res.status(403).json({ error: message });
      return;
    }
    if (message === 'Claim not found' || message === 'Person not found') {
      res.status(404).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}
