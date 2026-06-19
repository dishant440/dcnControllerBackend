import { Router } from 'express';
import { SlaveDeviceController } from './dcnDevice';

const router = Router();

router.route('/')
  .get(SlaveDeviceController.getDevices);

router.route('/:id')
  .get(SlaveDeviceController.getDeviceById);

export default router;
