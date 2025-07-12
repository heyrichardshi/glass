import * as transactions from "../services/transactions";
import asyncController from "./asyncController";
import { InvalidInputError, NotFoundError } from "../common/errors";

export const listByUser = asyncController(async (req, res) => {
  const userId = req.query.userId as string | undefined; // ?userId=...
  const paginationToken = req.query.paginationToken as string | undefined; // ?paginationToken=...

  if (!userId) {
    throw new InvalidInputError("userId");
  }

  const transactionsList = await transactions.listForUser(
    userId,
    paginationToken,
  );
  res.status(200).json(transactionsList);
});

export const updateTransaction = asyncController(async (req, res) => {
  const transactionId = req.params.transactionId as string | undefined;
  const { userId, date, description, notes, categoryId, tagIds } = req.body;

  if (!transactionId) {
    throw new NotFoundError("No such transaction found");
  }
  if (!userId) {
    throw new InvalidInputError("userId");
  }

  const response = await transactions.update({
    userId,
    transactionId,
    date,
    description,
    notes,
    categoryId,
    tagIds: Array.isArray(tagIds) ? tagIds : [tagIds].filter(Boolean),
  });

  res.status(200).json(response);
});
