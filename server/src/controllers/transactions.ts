import { Request, Response } from 'express';
import * as transactions from '../services/transactions';

export async function getByUser(req: Request, res: Response) {
    const userId = req.query.userId as string | undefined; // ?userId=...
    const paginationToken = req.query.paginationToken as string | undefined; // ?paginationToken=...

    console.log("userId:", userId);
    console.log("paginationToken:", paginationToken);

    if (!userId) {
        res.status(400).json({ message: "Missing userId" });
        return;
    }

    try {
        const transactionsList = await transactions.listForUser(userId, paginationToken);
        res.status(200).json(transactionsList);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
}
