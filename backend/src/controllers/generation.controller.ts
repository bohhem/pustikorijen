import type { Request, Response } from 'express';
import personService from '../services/person.service';

/**
 * Recalculate generation numbers for a branch
 * POST /api/v1/branches/:branchId/recalculate-generations
 */
export async function recalculateGenerations(req: Request, res: Response): Promise<void> {
  try {
    const { branchId } = req.params;

    const result = await personService.recalculateGenerations(branchId);

    res.status(200).json({
      message: 'Generations recalculated successfully',
      result,
    });
  } catch (error: any) {
    console.error('Recalculate generations error:', error);
    res.status(500).json({
      error: 'Failed to recalculate generations',
      details: error.message,
    });
  }
}
