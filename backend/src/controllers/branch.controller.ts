import { Request, Response } from 'express';
import {
  createBranchSchema,
  getBranchesSchema,
  joinRequestSchema,
  approveRejectSchema,
} from '../schemas/branch.schema';
import {
  createBranch,
  getBranches,
  getBranchById,
  getBranchMembers,
  requestJoinBranch,
  approveJoinRequest,
  rejectJoinRequest,
  getPendingJoinRequests,
} from '../services/branch.service';

/**
 * Create a new family branch
 * POST /api/v1/branches
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate input
    const validatedData = createBranchSchema.parse(req.body);

    // Create branch
    const branch = await createBranch({
      ...validatedData,
      foundedById: req.user.userId,
    });

    res.status(201).json({
      message: 'Branch created successfully',
      branch,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
}

/**
 * Get all branches with pagination and filters
 * GET /api/v1/branches
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    // Validate query params
    const validatedQuery = getBranchesSchema.parse(req.query);

    // Get branches
    const result = await getBranches(validatedQuery);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('List branches error:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
}

/**
 * Get branch by ID
 * GET /api/v1/branches/:id
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const branch = await getBranchById(id);

    res.status(200).json({ branch });
  } catch (error: any) {
    if (error.message === 'Branch not found') {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error('Get branch error:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
}

/**
 * Get branch members
 * GET /api/v1/branches/:id/members
 */
export async function getMembers(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const members = await getBranchMembers(id, req.user?.userId);

    res.status(200).json({ members });
  } catch (error: any) {
    if (error.message === 'Branch not found') {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
}

/**
 * Request to join a branch
 * POST /api/v1/branches/:id/join
 */
export async function joinRequest(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const validatedData = joinRequestSchema.parse(req.body);

    const joinReq = await requestJoinBranch(id, req.user.userId, validatedData.message);

    res.status(201).json({
      message: 'Join request submitted successfully',
      joinRequest: joinReq,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error.message.includes('Already') || error.message.includes('pending')) {
      res.status(409).json({ error: error.message });
      return;
    }

    if (error.message === 'Branch not found') {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error('Join request error:', error);
    res.status(500).json({ error: 'Failed to submit join request' });
  }
}

/**
 * Get pending join requests (Guru only)
 * GET /api/v1/branches/:id/join-requests
 */
export async function getPendingRequests(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const requests = await getPendingJoinRequests(id, req.user.userId);

    res.status(200).json({ requests });
  } catch (error: any) {
    if (error.message.includes('Only Gurus')) {
      res.status(403).json({ error: error.message });
      return;
    }

    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to fetch join requests' });
  }
}

/**
 * Approve join request (Guru only)
 * POST /api/v1/branches/:id/join-requests/approve
 */
export async function approveRequest(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const validatedData = approveRejectSchema.parse(req.body);

    const member = await approveJoinRequest(id, validatedData.userId, req.user.userId);

    res.status(200).json({
      message: 'Join request approved',
      member,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error.message.includes('Only Gurus')) {
      res.status(403).json({ error: error.message });
      return;
    }

    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Failed to approve join request' });
  }
}

/**
 * Reject join request (Guru only)
 * POST /api/v1/branches/:id/join-requests/reject
 */
export async function rejectRequest(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const validatedData = approveRejectSchema.parse(req.body);

    const result = await rejectJoinRequest(id, validatedData.userId, req.user.userId);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error.message.includes('Only Gurus')) {
      res.status(403).json({ error: error.message });
      return;
    }

    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Failed to reject join request' });
  }
}
