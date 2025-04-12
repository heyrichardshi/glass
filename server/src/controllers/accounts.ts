import { Request, Response } from 'express';
import * as accounts from '../services/accounts';
import { NotFoundError } from '../common/errors';

export async function registerAccounts(req: Request, res: Response) {
    try {
        await accounts.registerAccountsFromToken(req.params.token);
        res.status(200).send();
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
}

export async function refreshAccount(req: Request, res: Response) {
    try {
        await accounts.refresh(req.params.accountId);
        res.status(200).send();
      } catch (error: any) {
        if (error instanceof NotFoundError) {
          res.status(404).json({ message: error.message });
        } else {
          console.error("Unexpected error:", error);
          res.status(500).json({ message: error.message });
        }
      }
}
