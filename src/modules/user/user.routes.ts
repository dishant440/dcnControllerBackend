import { Router } from 'express';
import { UserController } from './user.controller';

const router = Router();

router.route('/')
  .get(UserController.getUsers);

router.post('/register', UserController.createUser);
router.post('/login', UserController.loginUser);

export default router;
