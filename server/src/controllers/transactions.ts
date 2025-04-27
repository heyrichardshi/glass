import * as transactions from "../services/transactions";
import asyncController from "./asyncController";
import { InvalidInputError } from "../common/errors";

export const listByUser = asyncController(async (req, res) => {
  const userId = req.query.userId as string | undefined; // ?userId=...
  const paginationToken = req.query.paginationToken as string | undefined; // ?paginationToken=...

  console.log("userId:", userId);
  console.log("paginationToken:", paginationToken);

  if (!userId) {
    throw new InvalidInputError("userId");
  }

  const transactionsList = await transactions.listForUser(
    userId,
    paginationToken,
  );
  res.status(200).json(transactionsList);
});
