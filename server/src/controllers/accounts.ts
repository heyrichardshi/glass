import { Request, Response } from 'express';
import * as teller from '../services/teller';
import { registerAccountsFromToken } from '../services/accounts';

export async function registerAccounts(req: Request, res: Response) {
    try {
        await registerAccountsFromToken(req.params.token);
        res.status(200).send();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}
