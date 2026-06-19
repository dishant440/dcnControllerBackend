import { Router } from 'express';
import userModuleRoutes from './modules/user/user.routes';
import slaveDeviceModuleRoutes from './modules/dcnDevice/dcnDevice.routes';

const router = Router();

// Register Feature Module Routes
router.use('/users', userModuleRoutes);
router.use('/slave-devices', slaveDeviceModuleRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

export default router;
