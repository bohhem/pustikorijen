import { Request, Response } from 'express';
import {
  assignSuperGuruToRegion,
  createAdminRegion,
  archiveBranchForAdmin,
  getSuperGuruRegionsOverview,
  getAdminRegionHierarchy,
  updateBranchRegionAssignment,
  hardDeleteBranch,
  listBranchesForAdmin,
  removeSuperGuruAssignment,
  unarchiveBranchForAdmin,
  updateSuperGuruAssignment,
} from '../services/admin.service';
import {
  clearPrimaryBridge,
  getBridgeIssues,
  setPrimaryBridge,
  superGuruRejectBridge,
  superGuruUpdateBridgeGeneration,
} from '../services/person-link.service';
import {
  assignGuruSchema,
  archiveBranchSchema,
  adminBranchListQuerySchema,
  createRegionSchema,
  updateBranchRegionSchema,
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

    const scope = req.user.globalRole === 'REGIONAL_GURU' ? 'ASSIGNED' : 'ALL';
    const regions = await getSuperGuruRegionsOverview({
      userId: req.user.userId,
      scope,
      regionIds: req.user.regionIds,
    });

    res.status(200).json({ regions });
  } catch (error: unknown) {
    console.error('Failed to load admin regions:', error);
    res.status(500).json({ error: 'Failed to load admin regions' });
  }
}

export async function getAdminRegionTree(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const regions = await getAdminRegionHierarchy();
    res.status(200).json({ regions });
  } catch (error) {
    console.error('Failed to load admin region hierarchy:', error);
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

    const scope = req.user.globalRole === 'REGIONAL_GURU' ? 'ASSIGNED' : 'ALL';
    const regions = await getSuperGuruRegionsOverview({
      userId: req.user.userId,
      scope,
      regionIds: req.user.regionIds,
    });
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

    const scope = req.user.globalRole === 'REGIONAL_GURU' ? 'ASSIGNED' : 'ALL';
    const regions = await getSuperGuruRegionsOverview({
      userId: req.user.userId,
      scope,
      regionIds: req.user.regionIds,
    });
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

    const scope = req.user.globalRole === 'REGIONAL_GURU' ? 'ASSIGNED' : 'ALL';
    const regions = await getSuperGuruRegionsOverview({
      userId: req.user.userId,
      scope,
      regionIds: req.user.regionIds,
    });
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

    const scope = req.user.globalRole === 'REGIONAL_GURU' ? 'ASSIGNED' : 'ALL';
    const regions = await getSuperGuruRegionsOverview({
      userId: req.user.userId,
      scope,
      regionIds: req.user.regionIds,
    });
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

export async function listAdminBranches(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const query = adminBranchListQuerySchema.parse(req.query);
    const result = await listBranchesForAdmin(query, req.user);
    res.status(200).json(result);
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);
    if (message === 'Region access denied') {
      res.status(403).json({ error: message });
      return;
    }

    console.error('Failed to load admin branches:', error);
    res.status(500).json({ error: 'Failed to load branches' });
  }
}

export async function archiveBranchAdmin(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { branchId } = req.params;
    const payload = archiveBranchSchema.parse(req.body);
    const branch = await archiveBranchForAdmin(branchId, {
      reason: payload.reason,
      actor: req.user,
    });

    res.status(200).json({ message: 'Branch archived', branch });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);
    if (message === 'Branch not found') {
      res.status(404).json({ error: message });
      return;
    }
    if (message === 'Branch already archived') {
      res.status(400).json({ error: message });
      return;
    }
    if (message === 'Branch access denied') {
      res.status(403).json({ error: message });
      return;
    }

    console.error('Failed to archive branch:', error);
    res.status(500).json({ error: 'Failed to archive branch' });
  }
}

export async function updateBranchRegion(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { branchId } = req.params;
    const payload = updateBranchRegionSchema.parse(req.body);
    const branch = await updateBranchRegionAssignment({
      branchId,
      regionId: payload.regionId,
      actor: req.user,
    });

    res.status(200).json({ message: 'Branch region updated', branch });
  } catch (error) {
    const message = getErrorMessage(error);

    if (message === 'Branch not found' || message === 'Region not found') {
      res.status(404).json({ error: message });
      return;
    }

    if (message === 'Branch access denied' || message === 'Region access denied') {
      res.status(403).json({ error: message });
      return;
    }

    console.error('Failed to update branch region:', error);
    res.status(500).json({ error: 'Failed to update branch region' });
  }
}

export async function unarchiveBranchAdmin(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { branchId } = req.params;
    const branch = await unarchiveBranchForAdmin(branchId, req.user);

    res.status(200).json({ message: 'Branch restored', branch });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === 'Branch not found') {
      res.status(404).json({ error: message });
      return;
    }

    if (message === 'Branch is not archived') {
      res.status(400).json({ error: message });
      return;
    }
    if (message === 'Branch access denied') {
      res.status(403).json({ error: message });
      return;
    }

    console.error('Failed to unarchive branch:', error);
    res.status(500).json({ error: 'Failed to unarchive branch' });
  }
}

export async function hardDeleteBranchAdmin(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { branchId } = req.params;
    await hardDeleteBranch(branchId, req.user);

    res.status(200).json({ message: 'Branch permanently deleted' });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === 'Branch not found') {
      res.status(404).json({ error: message });
      return;
    }

    if (message === 'Branch must be archived before hard deletion') {
      res.status(400).json({ error: message });
      return;
    }
    if (message === 'Branch access denied') {
      res.status(403).json({ error: message });
      return;
    }

    console.error('Failed to hard delete branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
}

export async function listBridgeIssues(_req: Request, res: Response): Promise<void> {
  try {
    const issues = await getBridgeIssues();
    res.status(200).json({ issues });
  } catch (error: unknown) {
    console.error('Failed to load bridge issues:', error);
    res.status(500).json({ error: 'Failed to load bridge issues' });
  }
}

export async function assignPrimaryBridge(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { linkId } = req.params;

    const updatedLink = await setPrimaryBridge(linkId, req.user);
    const issues = await getBridgeIssues();

    res.status(200).json({ message: 'Primary bridge assigned', link: updatedLink, issues });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === 'Link not found' || message === 'Only SuperGurus can manage primary bridges') {
      res.status(400).json({ error: message });
      return;
    }

    console.error('Failed to assign primary bridge:', error);
    res.status(500).json({ error: 'Failed to assign primary bridge' });
  }
}

export async function removePrimaryBridge(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { linkId } = req.params;

    await clearPrimaryBridge(linkId, req.user);
    const issues = await getBridgeIssues();

    res.status(200).json({ message: 'Primary bridge cleared', issues });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === 'Link not found' || message === 'Only SuperGurus can manage primary bridges') {
      res.status(400).json({ error: message });
      return;
    }

    console.error('Failed to clear primary bridge:', error);
    res.status(500).json({ error: 'Failed to clear primary bridge' });
  }
}

export async function rejectBridgeLink(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { linkId } = req.params;
    const { reason } = (req.body ?? {}) as { reason?: string };

    await superGuruRejectBridge(linkId, req.user, reason);
    const issues = await getBridgeIssues();

    res.status(200).json({ message: 'Bridge link rejected', issues });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === 'Link not found' || message === 'Cannot reject a primary bridge. Clear the primary status first.' || message === 'Only SuperGurus can manage primary bridges') {
      res.status(400).json({ error: message });
      return;
    }

    console.error('Failed to reject bridge link:', error);
    res.status(500).json({ error: 'Failed to reject bridge link' });
  }
}

export async function updateBridgeGeneration(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { linkId } = req.params;
    const { generationNumber } = (req.body ?? {}) as { generationNumber?: unknown };

    let parsed: number | null = null;
    if (generationNumber !== null && generationNumber !== undefined && generationNumber !== '') {
      const numeric = Number(generationNumber);
      if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
        res.status(400).json({ error: 'Generation override must be an integer' });
        return;
      }
      parsed = numeric;
    }

    await superGuruUpdateBridgeGeneration(linkId, req.user, parsed);
    const issues = await getBridgeIssues();

    res.status(200).json({
      message: parsed === null ? 'Bridge generation cleared' : 'Bridge generation updated',
      issues,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (
      message === 'Link not found' ||
      message === 'Cannot set generation on a rejected bridge' ||
      message === 'Generation override must be between 1 and 30' ||
      message === 'Generation override must be an integer' ||
      message === 'Only SuperGurus can manage primary bridges'
    ) {
      res.status(400).json({ error: message });
      return;
    }

    console.error('Failed to update bridge generation:', error);
    res.status(500).json({ error: 'Failed to update bridge generation' });
  }
}
