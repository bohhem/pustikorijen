import { Request, Response } from 'express';
import {
  createBranchSchema,
  getBranchesSchema,
  joinRequestSchema,
  approveRejectSchema,
  personLinkRequestSchema,
  personLinkListQuerySchema,
  personLinkDecisionSchema,
  personLinkSearchQuerySchema,
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
  updateMemberRole,
} from '../services/branch.service';
import {
  searchPersonsForLink,
  requestPersonLink,
  listPersonLinks as fetchPersonLinks,
  approvePersonLink,
  rejectPersonLink,
} from '../services/person-link.service';
import { getErrorMessage, isZodError } from '../utils/error.util';

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
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
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
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
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
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === 'Branch not found') {
      res.status(404).json({ error: message });
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
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === 'Branch not found') {
      res.status(404).json({ error: message });
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
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);

    if (message.includes('Already') || message.includes('pending')) {
      res.status(409).json({ error: message });
      return;
    }

    if (message === 'Branch not found') {
      res.status(404).json({ error: message });
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

    const requests = await getPendingJoinRequests(id, req.user);

    res.status(200).json({ requests });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.includes('Only branch Gurus')) {
      res.status(403).json({ error: message });
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

    const member = await approveJoinRequest(id, validatedData.userId, req.user);

    res.status(200).json({
      message: 'Join request approved',
      member,
    });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);

    if (message.includes('Only branch Gurus')) {
      res.status(403).json({ error: message });
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

    const result = await rejectJoinRequest(id, validatedData.userId, req.user);

    res.status(200).json(result);
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);

    if (message.includes('Only branch Gurus')) {
      res.status(403).json({ error: message });
      return;
    }

    if (message === 'Join request not found') {
      res.status(404).json({ error: message });
      return;
    }

    if (message === 'Join request is not pending') {
      res.status(409).json({ error: message });
      return;
    }

    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Failed to reject join request' });
  }
}

/**
 * Update member role (Guru only)
 * PATCH /api/v1/branches/:id/members/:userId/role
 */
export async function updateRole(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id, userId } = req.params;
    const { role } = req.body;

    if (!role) {
      res.status(400).json({ error: 'Role is required' });
      return;
    }

    const updatedMember = await updateMemberRole(id, userId, role, req.user);

    res.status(200).json({
      message: 'Member role updated successfully',
      member: updatedMember,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.includes('Only branch Gurus')) {
      res.status(403).json({ error: message });
      return;
    }

    if (message.includes('Invalid role') || message.includes('Member not found') || message.includes('Cannot demote')) {
      res.status(400).json({ error: message });
      return;
    }

    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
}

/**
 * Search for existing persons to link
 */
export async function searchLinkCandidates(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { q, limit } = personLinkSearchQuerySchema.parse(req.query);

    const results = await searchPersonsForLink(id, q, limit);

    res.status(200).json({ results });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);
    if (message === 'Branch not found' || message === 'Person belongs to a different region') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Search link candidates error:', error);
    res.status(500).json({ error: 'Failed to search existing persons' });
  }
}

/**
 * Create a link request for an existing person
 */
export async function createPersonLink(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const data = personLinkRequestSchema.parse(req.body);

    const link = await requestPersonLink({
      branchId: id,
      personId: data.personId,
      requestedBy: req.user.userId,
      displayName: data.displayName ?? null,
      notes: data.notes ?? null,
    });

    res.status(201).json({ message: 'Link request submitted', link });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);
    if (message === 'Branch not found' || message === 'Person not found' || message === 'Person already belongs to this branch') {
      res.status(404).json({ error: message });
      return;
    }

    if (message && message.includes('already exists')) {
      res.status(409).json({ error: message });
      return;
    }

    console.error('Create person link error:', error);
    res.status(500).json({ error: 'Failed to create person link request' });
  }
}

/**
 * List person link records for a branch
 */
export async function listPersonLinksController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { status } = personLinkListQuerySchema.parse(req.query);

    const links = await fetchPersonLinks({ branchId: id, status: status ?? null });

    res.status(200).json({ links });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);
    if (message === 'Branch not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('List person links error:', error);
    res.status(500).json({ error: 'Failed to fetch person links' });
  }
}

/**
 * Approve a person link request
 */
export async function approvePersonLinkRequest(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id, linkId } = req.params;
    const link = await approvePersonLink({ linkId, branchId: id, actor: req.user });

    res.status(200).json({ message: 'Person link approved', link });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === 'Link not found' || message === 'Branch not authorized to approve this link') {
      res.status(404).json({ error: message });
      return;
    }

    if (message === 'Only branch Gurus can perform this action' || message === 'Link has already been rejected') {
      res.status(403).json({ error: message });
      return;
    }

    console.error('Approve person link error:', error);
    res.status(500).json({ error: 'Failed to approve person link' });
  }
}

/**
 * Reject a person link request
 */
export async function rejectPersonLinkRequest(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id, linkId } = req.params;
    const data = personLinkDecisionSchema.parse(req.body);

    const link = await rejectPersonLink({
      linkId,
      branchId: id,
      actor: req.user,
      notes: data.notes ?? null,
    });

    res.status(200).json({ message: 'Person link rejected', link });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);
    if (message === 'Link not found' || message === 'Branch not authorized to reject this link') {
      res.status(404).json({ error: message });
      return;
    }

    if (message === 'Only branch Gurus can perform this action') {
      res.status(403).json({ error: message });
      return;
    }

    console.error('Reject person link error:', error);
    res.status(500).json({ error: 'Failed to reject person link' });
  }
}
