import { requireUserId } from "../middleware/requireToken";
import * as transactions from "../services/transaction.service";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  BulkUpdateTransactionsBody,
  BulkUpdateTransactionsResponse,
  ListTransactionsQuery,
  ListTransactionsResponse,
  SearchTransactionsBody,
  SearchTransactionsResponse,
  UpdateTransactionBody,
  UpdateTransactionParams,
  UpdateTransactionResponse,
} from "@glass/types/schemas";

export const listByUser = asyncController<
  NoParams,
  ListTransactionsQuery,
  NoBody,
  ListTransactionsResponse
>(async (req, res) => {
  const { paginationToken } = req.query;

  const transactionsList = await transactions.listForUser(
    requireUserId(req),
    paginationToken,
  );
  res.status(200).json(transactionsList);
});

export const search = asyncController<
  NoParams,
  NoQuery,
  SearchTransactionsBody,
  SearchTransactionsResponse
>(async (req, res) => {
  const { filters, paginationToken } = req.body;

  const response = await transactions.list({
    userId: requireUserId(req),
    filters,
    paginationToken,
  });

  res.status(200).json(response);
});

export const updateTransaction = asyncController<
  UpdateTransactionParams,
  NoQuery,
  UpdateTransactionBody,
  UpdateTransactionResponse
>(async (req, res) => {
  const transactionId = req.params.transactionId;
  const { date, description, notes, categoryId, tagIds, counterparty } =
    req.body;

  const response = await transactions.update({
    userId: requireUserId(req),
    transactionId,
    date,
    description,
    notes,
    categoryId,
    tagIds: tagIds,
    counterparty,
  });

  res.status(200).json(response);
});

export const bulkUpdateTransactions = asyncController<
  NoParams,
  NoQuery,
  BulkUpdateTransactionsBody,
  BulkUpdateTransactionsResponse
>(async (req, res) => {
  const { transactionIds, updates } = req.body;

  const response = await transactions.bulkUpdate({
    userId: requireUserId(req),
    transactionIds,
    updates: updates,
  });

  res.status(200).json(response);
});
