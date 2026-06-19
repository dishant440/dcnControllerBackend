import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { authMiddleware, CheckPolicyAccess } from '../../middlewares/auth';

const router = Router();

router.get('/getAllProfile', authMiddleware as any, CheckPolicyAccess('profile', 'view') as any, ProfileController.getProfiles);
router.post('/addProfile', authMiddleware as any, CheckPolicyAccess('profile', 'create') as any, ProfileController.addProfile);
router.post('/updateProfile', authMiddleware as any, CheckPolicyAccess('profile', 'edit') as any, ProfileController.updateProfile);
router.delete('/deleteProfile', authMiddleware as any, CheckPolicyAccess('profile', 'delete') as any, ProfileController.deleteProfile);
router.get('/getProfileList', authMiddleware as any, CheckPolicyAccess('profile', 'view') as any, ProfileController.getProfilesList);
router.get('/viewProfile', authMiddleware as any, CheckPolicyAccess('profile', 'view') as any, ProfileController.viewProfile);
router.get('/profileSuggestion', authMiddleware as any, CheckPolicyAccess('profile', 'view') as any, ProfileController.findProfile);

export default router;
