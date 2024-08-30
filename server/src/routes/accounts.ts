import { Router } from 'express';
import { registerAccounts } from '../controllers/accounts';

const router = Router();

router.post('/register/:token', registerAccounts);

export default router;
