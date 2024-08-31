import { Router } from 'express';
import { refreshAccount, registerAccounts } from '../controllers/accounts';

const router = Router();

router.post('/register/:token', registerAccounts);

router.post('/refresh/:accountId', refreshAccount);

export default router;
