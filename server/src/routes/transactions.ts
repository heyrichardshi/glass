import { Router } from 'express';
import * as transactions from '../controllers/transactions';

const router = Router();

router.get('/transactions', transactions.getByUser);

export default router;
