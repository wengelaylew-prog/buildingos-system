import { authenticate } from '../../middleware/auth.ts';
import { Router } from 'express';
import { AuthController } from './auth.controller.ts';

export const authRouter = Router();

authRouter.post('/register', AuthController.register);
authRouter.post('/login', AuthController.login);


authRouter.post('/seed-demo', authenticate, AuthController.seedDemo);
