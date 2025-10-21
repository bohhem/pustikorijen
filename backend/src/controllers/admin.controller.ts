import { Request, Response } from 'express';
import {
  assignSuperGuruToRegion,
  createAdminRegion,
  getSuperGuruRegionsOverview,
  removeSuperGuruAssignment,
  updateSuperGuruAssignment,
} from '../services/admin.service';
import {
  assignGuruSchema,
  createRegionSchema,
  updateAssignmentSchema,
} from '../schemas/admin.schema';
import { getErrorMessage, isZodError } from '../utils/error.util';

/**
 * GET /api/v1/admin/regions
 * Returns regions assigned to the authenticated SuperGuru along with summary stats.
 */
export async function getAdminRegions(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const regions = await getSuperGuruRegionsOverview(req.user.userId);

    res.status(200).json({ regions });
  } catch (error: unknown) {
    console.error('Failed to load admin regions:', error);
    res.status(500).json({ error: 'Failed to load admin regions' });
  }
}

export async function createRegion(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validated = createRegionSchema.parse(req.body);

    await createAdminRegion(validated);

    const regions = await getSuperGuruRegionsOverview(req.user.userId);
    res.status(201).json({ message: 'Region created', regions });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);

    if (message === 'Region code already exists') {
      res.status(409).json({ error: message });
      return;
    }

    console.error('Failed to create admin region:', error);
    res.status(500).json({ error: 'Failed to create admin region' });
  }
}

export async function assignRegionGuru(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { regionId } = req.params;
    const validated = assignGuruSchema.parse(req.body);

    await assignSuperGuruToRegion({
      regionId,
      data: validated,
      requestedByUserId: req.user.userId,
    });

    const regions = await getSuperGuruRegionsOverview(req.user.userId);
    res.status(200).json({ message: 'SuperGuru assigned', regions });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);

    if (message === 'Region not found' || message === 'User not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Failed to assign SuperGuru to region:', error);
    res.status(500).json({ error: 'Failed to assign SuperGuru' });
  }
}

export async function updateRegionAssignment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { regionId, assignmentId } = req.params;
    const validated = updateAssignmentSchema.parse(req.body);

    await updateSuperGuruAssignment({
      regionId,
      assignmentId,
      data: validated,
    });

    const regions = await getSuperGuruRegionsOverview(req.user.userId);
    res.status(200).json({ message: 'Assignment updated', regions });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);

    if (message === 'Assignment not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Failed to update SuperGuru assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
}

export async function deleteRegionAssignment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { regionId, assignmentId } = req.params;

    await removeSuperGuruAssignment({ regionId, assignmentId });

    const regions = await getSuperGuruRegionsOverview(req.user.userId);
    res.status(200).json({ message: 'Assignment removed', regions });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message === 'Assignment not found') {
      res.status(404).json({ error: message });
      return;
    }

    if (message === 'Cannot remove the last SuperGuru assigned to region') {
      res.status(400).json({ error: message });
      return;
    }

    console.error('Failed to remove SuperGuru assignment:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
}
