import * as transactions from "../services/transactions";
import asyncController from "./asyncController";
import { InvalidInputError, NotFoundError } from "../common/errors";

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

export const updateTransaction = asyncController(async (req, res) => {
  const transactionId = req.params.transactionId as string | undefined;
  const userId = req.query.userId as string | undefined;
  const date = req.query.date as string | undefined;
  const description = req.query.description as string | undefined;
  const notes = req.query.notes as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const rawTagIds = req.query.tagIds;
  const tagIds = (
    Array.isArray(rawTagIds) ? rawTagIds : [rawTagIds].filter(Boolean)
  ) as string[];

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
    tagIds,
  });

  res.status(200).json(response);
});
