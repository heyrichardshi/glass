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
} from "@saffron/types/schemas";

export const listByUser = asyncController<
  NoParams,
  ListTransactionsQuery,
  NoBody,
  ListTransactionsResponse
>(async (req, res) => {
  const { userId, paginationToken } = req.query;

  const transactionsList = await transactions.listForUser(
    userId,
    paginationToken,
  );
  res.status(200).json(transactionsList);
});

export const search = asyncController<
  NoParams,
  SearchTransactionsBody,
  NoBody,
  SearchTransactionsResponse
>(async (req, res) => {
  const userId = "0";
  const { filters, paginationToken } = req.body;

  const response = await transactions.list({
    userId,
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
  const { userId, date, description, notes, categoryId, tagIds, counterparty } =
    req.body;

  const response = await transactions.update({
    userId,
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
  const { userId, transactionIds, updates } = req.body;

  const response = await transactions.bulkUpdate({
    userId,
    transactionIds,
    updates: updates,
  });

  res.status(200).json(response);
});
