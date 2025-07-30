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
  const { userId, date, description, notes, categoryId, tagIds, counterparty } =
    req.body;

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
    counterparty,
  });

  res.status(200).json(response);
});

export const bulkUpdateTransactions = asyncController(async (req, res) => {
  const { userId, transactionIds, updates } = req.body;

  if (!userId) {
    throw new InvalidInputError("userId");
  }

  if (!transactionIds || !Array.isArray(transactionIds)) {
    throw new InvalidInputError("transactionIds must be an array");
  }

  if (!updates || typeof updates !== "object") {
    throw new InvalidInputError("updates must be an object");
  }

  // Handle tagIds array conversion if present
  const processedUpdates = { ...updates };
  if (updates.tagIds) {
    processedUpdates.tagIds = Array.isArray(updates.tagIds)
      ? updates.tagIds
      : [updates.tagIds].filter(Boolean);
  }

  const response = await transactions.bulkUpdate({
    userId,
    transactionIds,
    updates: processedUpdates,
  });

  res.status(200).json(response);
});
