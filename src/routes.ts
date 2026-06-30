import { Router } from 'express';
import userModuleRoutes from './modules/user/user.routes';
import policyModuleRoutes from './modules/user/policy.routes';
import slaveDeviceModuleRoutes from './modules/dcnDevice/dcnDevice.routes';
import profileModuleRoutes from './modules/profile/profile.routes';
import productModuleRoutes from './modules/product/product.routes';
import terminalModuleRoutes from './modules/terminal/terminal.routes';
import { SlaveDeviceController } from './modules/dcnDevice/dcnDevice';

const router = Router();

// Register Feature Module Routes
router.use('/users', userModuleRoutes);
router.use('/policy', policyModuleRoutes);
router.use('/slave-devices', slaveDeviceModuleRoutes);
router.use('/profile', profileModuleRoutes);
router.use('/products', productModuleRoutes);
router.use('/terminals', terminalModuleRoutes);

// Mount user routes at root level for legacy backward compatibility (e.g., /api/signin)
router.use('/', userModuleRoutes);

// Direct endpoint for backward-compatibility with older DCN loggers
router.post('/addesp', SlaveDeviceController.addDcn);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

export default router;
