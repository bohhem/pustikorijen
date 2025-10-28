import { Request, Response } from 'express';
import personService from '../services/person.service';
import { movePersonToBranch } from '../services/person-move.service';
import { createPersonSchema, updatePersonSchema } from '../validators/person.validator';
import { movePersonSchema } from '../schemas/branch.schema';
import { getErrorMessage, isZodError } from '../utils/error.util';

export const createPerson = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // Validate input
    const validatedData = createPersonSchema.parse(req.body);

    const person = await personService.createPerson(branchId, req.user, validatedData);

    return res.status(201).json({
      message: 'Person created successfully',
      person,
    });
  } catch (error: unknown) {
    console.error('Error creating person:', error);

    if (isZodError(error)) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }

    const message = getErrorMessage(error) || 'Failed to create person';

    return res.status(400).json({ error: message });
  }
};

export const getPersonsByBranch = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    const persons = await personService.getPersonsByBranch(branchId, req.user);

    return res.json({ persons });
  } catch (error: unknown) {
    console.error('Error fetching persons:', error);
    const message = getErrorMessage(error) || 'Failed to fetch persons';
    return res.status(400).json({ error: message });
  }
};

export const getPersonById = async (req: Request, res: Response) => {
  try {
    const { branchId, personId } = req.params;

    const person = await personService.getPersonById(branchId, personId, req.user);

    res.json({ person });
  } catch (error: unknown) {
    console.error('Error fetching person:', error);
    const message = getErrorMessage(error) || 'Person not found';
    res.status(404).json({ error: message });
  }
};

export const updatePerson = async (req: Request, res: Response) => {
  try {
    const { branchId, personId } = req.params;
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // Validate input
    const validatedData = updatePersonSchema.parse(req.body);

    const person = await personService.updatePerson(branchId, personId, req.user, validatedData);

    return res.json({
      message: 'Person updated successfully',
      person,
    });
  } catch (error: unknown) {
    console.error('Error updating person:', error);

    if (isZodError(error)) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }

    const message = getErrorMessage(error) || 'Failed to update person';
    return res.status(400).json({ error: message });
  }
};

export const deletePerson = async (req: Request, res: Response) => {
  try {
    const { branchId, personId } = req.params;
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await personService.deletePerson(branchId, personId, req.user);

    res.json({ message: 'Person deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting person:', error);
    const message = getErrorMessage(error) || 'Failed to delete person';
    res.status(400).json({ error: message });
  }
};

export const getFamilyTree = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    const tree = await personService.getFamilyTree(branchId);

    res.json({ tree });
  } catch (error: unknown) {
    console.error('Error fetching family tree:', error);
    const message = getErrorMessage(error) || 'Failed to fetch family tree';
    res.status(400).json({ error: message });
  }
};

export const movePerson = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { branchId, personId } = req.params;
    const payload = movePersonSchema.parse(req.body);

    const result = await movePersonToBranch({
      sourceBranchId: branchId,
      targetBranchId: payload.targetBranchId,
      personId,
      actor: req.user,
      notes: payload.notes ?? null,
    });

    res.json({
      message: 'Person moved successfully',
      person: result,
    });
  } catch (error: unknown) {
    console.error('Error moving person:', error);

    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error) || 'Failed to move person';
    res.status(400).json({ error: message });
  }
};
