import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware, CheckPolicyAccess } from '../../middlewares/auth';

const router = Router();

// Legacy endpoints
router.post('/addNewUser', authMiddleware, CheckPolicyAccess('users', 'create'), UserController.addNewUser);
router.get('/getAllUser', authMiddleware, CheckPolicyAccess('users', 'view'), UserController.getUser);
router.delete('/deleteUser/:id', authMiddleware, CheckPolicyAccess('users', 'delete'), UserController.deleteUser);
router.put('/editUser/:id', authMiddleware, CheckPolicyAccess('users', 'edit'), UserController.editUser);
router.post('/signin', UserController.SignIn);
router.put('/updatePolicy/:userId', authMiddleware, CheckPolicyAccess('users', 'configure'), UserController.updateUserPolicy);
router.get('/getUserSuggestion', authMiddleware, UserController.findUser);

// Modular endpoints
router.get('/', authMiddleware, CheckPolicyAccess('users', 'view'), UserController.getUser);
router.post('/register', UserController.addNewUser);
router.post('/login', UserController.SignIn);

export default router;
