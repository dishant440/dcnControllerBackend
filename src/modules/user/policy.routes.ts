import { Router } from 'express';
import { PolicyController } from './policy.controller';
import { authMiddleware, CheckPolicyAccess } from '../../middlewares/auth';

const router = Router();

// POST: Create a policy
router.post('/createPolicy', authMiddleware, CheckPolicyAccess('policy', 'create'), PolicyController.createPolicy);

// GET: List all policies
router.get('/policies', authMiddleware, CheckPolicyAccess('policy', 'view'), PolicyController.getAllPolicies);

// GET: Get a single policy
router.get('/policies/:id', authMiddleware, PolicyController.getPolicyById);

// PUT: Update a policy
router.put('/updatepolicy/:id', authMiddleware, CheckPolicyAccess('policy', 'edit'), PolicyController.updatePolicy);

// GET: Select Policy for suggestions
router.get('/selectedPolicy', authMiddleware, PolicyController.getSelectedPolicy);

// DELETE: Remove a policy
router.delete('/deletePolicy/:id', authMiddleware, CheckPolicyAccess('policy', 'delete'), PolicyController.deletePolicy);

export default router;
