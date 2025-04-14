import { Request, Response } from "express";
import * as accounts from "../services/accounts";
import { NotFoundError } from "../common/errors";

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

export async function listAccountsForUser(req: Request, res: Response) {
  const userId = req.query.userId as string | undefined; // ?userId=...
  console.log("userId:", userId);

  if (!userId) {
    res.status(400).json({ message: "Missing userId" });
    return;
  }

  try {
    const accountsList = await accounts.listForUser(userId);
    res.status(200).json(accountsList);
  } catch (error: any) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: error.message });
  }
}
