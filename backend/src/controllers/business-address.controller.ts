import { Request, Response } from 'express';
import {
  getGuruBusinessAddress as getGuruBusinessAddressService,
  upsertGuruBusinessAddress as upsertGuruBusinessAddressService,
  listPersonBusinessAddresses as listPersonBusinessAddressesService,
  createPersonBusinessAddress as createPersonBusinessAddressService,
  updatePersonBusinessAddress as updatePersonBusinessAddressService,
  deletePersonBusinessAddress as deletePersonBusinessAddressService,
} from '../services/business-address.service';
import {
  upsertGuruBusinessAddressSchema,
  createPersonBusinessAddressSchema,
  updatePersonBusinessAddressSchema,
} from '../validators/business-address.validator';
import { getErrorMessage, isZodError } from '../utils/error.util';

export async function getGuruBusinessAddress(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const address = await getGuruBusinessAddressService(req.user.userId);
  res.json({ address });
}

export async function upsertGuruBusinessAddress(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payload = upsertGuruBusinessAddressSchema.parse(req.body);
    const address = await upsertGuruBusinessAddressService(req.user, payload);

    res.json({
      message: 'Business address saved',
      address,
    });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }

    const message = getErrorMessage(error) || 'Failed to save business address';
    res.status(400).json({ error: message });
  }
}

export async function listPersonBusinessAddresses(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { branchId, personId } = req.params;
    const addresses = await listPersonBusinessAddressesService(branchId, personId, req.user);
    res.json({ addresses });
  } catch (error: unknown) {
    const message = getErrorMessage(error) || 'Failed to fetch addresses';
    res.status(400).json({ error: message });
  }
}

export async function createPersonBusinessAddress(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { branchId, personId } = req.params;
    const payload = createPersonBusinessAddressSchema.parse(req.body);
    const address = await createPersonBusinessAddressService(branchId, personId, req.user, payload);
    res.status(201).json({
      message: 'Business address added',
      address,
    });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    const message = getErrorMessage(error) || 'Failed to add address';
    res.status(400).json({ error: message });
  }
}

export async function updatePersonBusinessAddress(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { branchId, personId, addressId } = req.params;
    const payload = updatePersonBusinessAddressSchema.parse(req.body);
    const address = await updatePersonBusinessAddressService(branchId, personId, addressId, req.user, payload);
    res.json({
      message: 'Business address updated',
      address,
    });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    const message = getErrorMessage(error) || 'Failed to update address';
    res.status(400).json({ error: message });
  }
}

export async function deletePersonBusinessAddress(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { branchId, personId, addressId } = req.params;
    await deletePersonBusinessAddressService(branchId, personId, addressId, req.user);
    res.json({ message: 'Business address removed' });
  } catch (error: unknown) {
    const message = getErrorMessage(error) || 'Failed to delete address';
    res.status(400).json({ error: message });
  }
}
