import { Request, Response } from 'express';
import { createPlaceholderSchema, claimPlaceholderSchema, resolvePlaceholderSchema } from '../schemas/placeholder.schema';
import { getErrorMessage, isZodError } from '../utils/error.util';
import {
  createPlaceholder,
  listPlaceholders,
  claimPlaceholder,
  listPlaceholderClaims,
  resolvePlaceholderClaim,
} from '../services/placeholder.service';

export async function listBranchPlaceholders(req: Request, res: Response) {
  try {
    const { id: branchId } = req.params;
    const placeholders = await listPlaceholders(branchId, req.user);
    res.json({ placeholders });
  } catch (error) {
    const message = getErrorMessage(error) || 'Failed to load placeholders';
    res.status(400).json({ error: message });
  }
}

export async function createBranchPlaceholder(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id: branchId } = req.params;
    const payload = createPlaceholderSchema.parse(req.body);
    const placeholderId = await createPlaceholder(branchId, req.user, payload);
    res.status(201).json({ message: 'Placeholder created', placeholderId });
  } catch (error) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    const message = getErrorMessage(error) || 'Failed to create placeholder';
    res.status(400).json({ error: message });
  }
}

export async function claimBranchPlaceholder(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id: branchId, placeholderId } = req.params;
    const payload = claimPlaceholderSchema.parse(req.body);
    await claimPlaceholder(branchId, placeholderId, req.user, payload.message ?? null);
    res.json({ message: 'Claim submitted' });
  } catch (error) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    const message = getErrorMessage(error) || 'Failed to submit claim';
    res.status(400).json({ error: message });
  }
}

export async function listBranchPlaceholderClaims(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id: branchId } = req.params;
    const claims = await listPlaceholderClaims(branchId, req.user);
    res.json({ claims });
  } catch (error) {
    const message = getErrorMessage(error) || 'Failed to load claims';
    res.status(400).json({ error: message });
  }
}

export async function resolveBranchPlaceholderClaim(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id: branchId, claimId } = req.params;
    const payload = resolvePlaceholderSchema.parse(req.body);
    await resolvePlaceholderClaim(branchId, claimId, req.user, payload);
    res.json({ message: 'Claim updated' });
  } catch (error) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    const message = getErrorMessage(error) || 'Failed to update claim';
    res.status(400).json({ error: message });
  }
}
