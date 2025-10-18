import { Request, Response } from 'express';
import personService from '../services/person.service';
import { createPersonSchema, updatePersonSchema } from '../validators/person.validator';

export const createPerson = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const userId = (req as any).user.userId;

    // Validate input
    const validatedData = createPersonSchema.parse(req.body);

    const person = await personService.createPerson(branchId, userId, validatedData);

    return res.status(201).json({
      message: 'Person created successfully',
      person,
    });
  } catch (error: any) {
    console.error('Error creating person:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    return res.status(400).json({ error: error.message || 'Failed to create person' });
  }
};

export const getPersonsByBranch = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    const persons = await personService.getPersonsByBranch(branchId);

    return res.json({ persons });
  } catch (error: any) {
    console.error('Error fetching persons:', error);
    return res.status(400).json({ error: error.message || 'Failed to fetch persons' });
  }
};

export const getPersonById = async (req: Request, res: Response) => {
  try {
    const { branchId, personId } = req.params;

    const person = await personService.getPersonById(branchId, personId);

    res.json({ person });
  } catch (error: any) {
    console.error('Error fetching person:', error);
    res.status(404).json({ error: error.message || 'Person not found' });
  }
};

export const updatePerson = async (req: Request, res: Response) => {
  try {
    const { branchId, personId } = req.params;
    const userId = (req as any).user.userId;

    // Validate input
    const validatedData = updatePersonSchema.parse(req.body);

    const person = await personService.updatePerson(branchId, personId, userId, validatedData);

    return res.json({
      message: 'Person updated successfully',
      person,
    });
  } catch (error: any) {
    console.error('Error updating person:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    return res.status(400).json({ error: error.message || 'Failed to update person' });
  }
};

export const deletePerson = async (req: Request, res: Response) => {
  try {
    const { branchId, personId } = req.params;
    const userId = (req as any).user.userId;

    await personService.deletePerson(branchId, personId, userId);

    res.json({ message: 'Person deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting person:', error);
    res.status(400).json({ error: error.message || 'Failed to delete person' });
  }
};

export const getFamilyTree = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    const tree = await personService.getFamilyTree(branchId);

    res.json({ tree });
  } catch (error: any) {
    console.error('Error fetching family tree:', error);
    res.status(400).json({ error: error.message || 'Failed to fetch family tree' });
  }
};
