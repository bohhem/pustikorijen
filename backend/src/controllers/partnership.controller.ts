import type { Request, Response } from 'express';
import {
  createPartnership,
  getBranchPartnerships,
  getPersonPartnerships,
  getPartnershipById,
  updatePartnership,
  deletePartnership,
  getPersonSpouse,
} from '../services/partnership.service';
import {
  createPartnershipSchema,
  updatePartnershipSchema,
} from '../validators/partnership.validator';

/**
 * Create partnership
 * POST /api/v1/branches/:branchId/partnerships
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { branchId } = req.params;
    const validation = createPartnershipSchema.safeParse({
      ...req.body,
      branchId,
    });

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const partnership = await createPartnership(
      validation.data,
      req.user!.userId
    );

    res.status(201).json({ partnership });
  } catch (error: any) {
    console.error('Create partnership error:', error);
    if (error.message.includes('not found') || error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to create partnership' });
  }
}

/**
 * Get partnerships for a branch
 * GET /api/v1/branches/:branchId/partnerships
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const { branchId } = req.params;
    const partnerships = await getBranchPartnerships(branchId);
    res.status(200).json({ partnerships });
  } catch (error: any) {
    console.error('List partnerships error:', error);
    res.status(500).json({ error: 'Failed to fetch partnerships' });
  }
}

/**
 * Get partnerships for a person
 * GET /api/v1/branches/:branchId/persons/:personId/partnerships
 */
export async function getByPerson(req: Request, res: Response): Promise<void> {
  try {
    const { personId } = req.params;
    const partnerships = await getPersonPartnerships(personId);
    res.status(200).json({ partnerships });
  } catch (error: any) {
    console.error('Get person partnerships error:', error);
    res.status(500).json({ error: 'Failed to fetch partnerships' });
  }
}

/**
 * Get partnership by ID
 * GET /api/v1/branches/:branchId/partnerships/:id
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const partnership = await getPartnershipById(id);
    res.status(200).json({ partnership });
  } catch (error: any) {
    if (error.message === 'Partnership not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Get partnership error:', error);
    res.status(500).json({ error: 'Failed to fetch partnership' });
  }
}

/**
 * Update partnership
 * PATCH /api/v1/branches/:branchId/partnerships/:id
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const validation = updatePartnershipSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const partnership = await updatePartnership(
      id,
      validation.data,
      req.user!.userId
    );

    res.status(200).json({ partnership });
  } catch (error: any) {
    if (error.message === 'Partnership not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Update partnership error:', error);
    res.status(500).json({ error: 'Failed to update partnership' });
  }
}

/**
 * Delete partnership
 * DELETE /api/v1/branches/:branchId/partnerships/:id
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await deletePartnership(id, req.user!.userId);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Partnership not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Delete partnership error:', error);
    res.status(500).json({ error: 'Failed to delete partnership' });
  }
}

/**
 * Get spouse for a person
 * GET /api/v1/branches/:branchId/persons/:personId/spouse
 */
export async function getSpouse(req: Request, res: Response): Promise<void> {
  try {
    const { personId } = req.params;
    const spouse = await getPersonSpouse(personId);

    if (!spouse) {
      res.status(404).json({ error: 'No active spouse found' });
      return;
    }

    res.status(200).json({ spouse });
  } catch (error: any) {
    console.error('Get spouse error:', error);
    res.status(500).json({ error: 'Failed to fetch spouse' });
  }
}
