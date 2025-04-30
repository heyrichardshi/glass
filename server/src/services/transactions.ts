import {
  ListTransactionsResponse,
  UpdateTransactionRequest,
  UpdateTransactionResponse,
} from "@saffron/types";
import { TransactionRepository } from "../repositories";
import { Transaction } from "../models";
import {
  InvalidInputWithCustomMessageError,
  NotFoundError,
} from "../common/errors";

/**
 * Retrieves all transactions for a given user, in reverse chronological order.
 */
export async function listForUser(
  userId: string,
  paginationToken?: string,
): Promise<ListTransactionsResponse> {
  const transactionRepo = await TransactionRepository.getInstance();

  return transactionRepo.listTransactionsByUser(userId, paginationToken);
}

const UPDATE_TRANSACTION_KEYS = [
  "date",
  "description",
  "notes",
  "categoryId",
] as const;

export async function update(
  request: UpdateTransactionRequest,
): Promise<UpdateTransactionResponse> {
  // Create a map of the changes in the request
  let newValues: Partial<Transaction> = {};

  UPDATE_TRANSACTION_KEYS.forEach((key) => {
    if (request[key] !== undefined) {
      newValues[key] = request[key];
    }
  });

  // The compiler complains about a type mismatch error if we include this in UPDATE_TRANSACTION_KEYS, so handle it separately for now.
  if (request.tagIds) {
    newValues["tagIds"] = request.tagIds;
  }

  // Short-circuit if no changes were requested
  if (Object.keys(newValues).length === 0) {
    throw new InvalidInputWithCustomMessageError(
      "Update request must include at least one key to update.",
    );
  }

  const transactionRepo = await TransactionRepository.getInstance();

  // Retrieve existing item to apply changes to
  const existing = await transactionRepo.get(
    request.transactionId,
    request.userId,
  );
  if (!existing) {
    throw new NotFoundError(
      `The given transaction '${request.transactionId}' does not exist.`,
    );
  }

  // Cross-check and remove any keys that are the same as the existing values
  UPDATE_TRANSACTION_KEYS.forEach((key) => {
    if (newValues[key] === undefined) {
      return;
    }
    console.log(
      "Comparing new key to old key: ",
      key,
      newValues[key],
      existing[key],
      newValues[key] == existing[key],
      newValues[key] === existing[key],
    );
    if (newValues[key] === existing[key]) {
      console.log(
        `Value for key '${key}' (${newValues[key]}) is the same as existing value (${existing[key]}); removing from new values.`,
      );
      delete newValues[key];
    }
  });

  // Need to handle tagIds separately since it is a list
  if (newValues.tagIds !== undefined) {
    console.log(
      "Comparing new tagIds to old tagIds: ",
      newValues.tagIds,
      existing.tagIds,
    );
    const newTagIds = newValues.tagIds || [];

    // Remove any tag IDs that are the same as the existing values
    newValues.tagIds = newTagIds.filter(
      (tagId) => !existing.tagIds.includes(tagId),
    );
    console.log("New tagIds after filtering: ", newValues.tagIds);

    // If all tag IDs are the same, remove the key from newValues
    if (newValues.tagIds.length === 0) {
      console.log("All tagIds are the same; removing from new values.");
      delete newValues.tagIds;
    }
  }

  // Short-circuit if all requested changes matched the existing values
  if (Object.keys(newValues).length === 0) {
    throw new InvalidInputWithCustomMessageError(
      "Update request had no new values to write.",
    );
  }

  console.log("Updating transaction with new values: ", newValues, request);

  const newTransaction = {
    ...existing,
    ...newValues,
  } as Transaction;

  return { transaction: await transactionRepo.upsert(newTransaction) };
}
