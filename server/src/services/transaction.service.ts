import {
  UpdateTransactionRequest,
  UpdateTransactionResponse,
  BulkUpdateTransactionsRequest,
  BulkUpdateTransactionsResponse,
} from "@glass/types";
import { TransactionRepository, TagRepository } from "../repositories";
import { Transaction } from "../models";
import {
  InvalidInputWithCustomMessageError,
  NotFoundError,
} from "../common/errors";
import {
  ListTransactionsResponse,
  TransactionSearchFilters,
} from "@glass/types/schemas";

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

export async function list(params: {
  userId: string;
  filters: TransactionSearchFilters;
  paginationToken?: string;
}): Promise<ListTransactionsResponse> {
  const transactionRepo = await TransactionRepository.getInstance();
  return transactionRepo.list({
    userId: params.userId,
    searchText: params.filters.searchText,
    accountIds: params.filters.accountIds,
    merchantIds: params.filters.merchantIds,
    categoryIds: params.filters.categoryIds,
    tagIds: params.filters.tagIds,
    startDate: params.filters.startDate,
    endDate: params.filters.endDate,
    paginationToken: params.paginationToken,
  });
}

const UPDATE_TRANSACTION_KEYS = [
  "date",
  "description",
  "notes",
  "categoryId",
  "counterparty",
] as const;

export async function update(
  userId: string,
  request: UpdateTransactionRequest,
): Promise<UpdateTransactionResponse> {
  // Create a map of the changes in the request
  let newValues: Partial<Transaction> = {};

  UPDATE_TRANSACTION_KEYS.forEach((key) => {
    if (request[key] !== undefined) {
      // Sidestep TS type checking, we are assigning type-correct values to each key.
      (newValues as any)[key] = request[key];
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
  const tagRepo = await TagRepository.getInstance();

  // Retrieve existing item to apply changes to
  const existing = await transactionRepo.get(request.transactionId, userId);
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

    // Check if the arrays are different (different length or different content)
    const areArraysDifferent =
      newTagIds.length !== existing.tagIds.length ||
      newTagIds.some((tagId) => !existing.tagIds.includes(tagId)) ||
      existing.tagIds.some((tagId) => !newTagIds.includes(tagId));

    if (!areArraysDifferent) {
      console.log("Tag arrays are the same; removing from new values.");
      delete newValues.tagIds;
    } else {
      // Sort tagIds by their corresponding tag names before saving
      const tags = await tagRepo.listAll(userId);
      const tagMap = new Map(tags.map((tag) => [tag.id, tag.name]));

      newValues.tagIds = newTagIds.sort((a, b) => {
        const nameA = tagMap.get(a) || "";
        const nameB = tagMap.get(b) || "";
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
      });
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

/**
 * Updates multiple transactions in bulk. Tags are updated additively (existing tags are preserved).
 *
 * @param userId - The owner of the transactions being updated.
 * @param request - The request object containing the transaction IDs and updates.
 * @returns A response object containing the updated transactions and any failures.
 */
export async function bulkUpdate(
  userId: string,
  request: BulkUpdateTransactionsRequest,
): Promise<BulkUpdateTransactionsResponse> {
  const { transactionIds, updates } = request;

  if (!transactionIds || transactionIds.length === 0) {
    throw new InvalidInputWithCustomMessageError(
      "At least one transaction ID must be provided for bulk update.",
    );
  }

  if (Object.keys(updates).length === 0) {
    throw new InvalidInputWithCustomMessageError(
      "At least one field must be provided for bulk update.",
    );
  }

  const transactionRepo = await TransactionRepository.getInstance();
  const tagRepo = await TagRepository.getInstance();

  const existingTransactions = await transactionRepo.getBulk(
    transactionIds,
    userId,
  );

  const updatedTransactions: Transaction[] = [];
  const failedUpdates: { transactionId: string; error: string }[] = [];

  for (const transactionId of transactionIds) {
    try {
      const existing = existingTransactions[transactionId];

      if (!existing) {
        failedUpdates.push({
          transactionId,
          error: `Transaction '${transactionId}' not found.`,
        });
        continue;
      }

      // Apply updates to the existing transaction
      const updatedTransaction = {
        ...existing,
        ...updates,
      } as Transaction;

      // Handle tagIds sorting if provided
      if (updates.tagIds !== undefined) {
        const tags = await tagRepo.listAll(userId);
        const tagMap = new Map(tags.map((tag) => [tag.id, tag.name]));

        updatedTransaction.tagIds = updates.tagIds.sort(
          (a: string, b: string) => {
            const nameA = tagMap.get(a) || "";
            const nameB = tagMap.get(b) || "";
            return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
          },
        );
      }

      // Save the updated transaction
      const savedTransaction = await transactionRepo.upsert(updatedTransaction);
      updatedTransactions.push(savedTransaction);
    } catch (error) {
      console.error(`Failed to update transaction ${transactionId}:`, error);
      failedUpdates.push({
        transactionId,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  return {
    updatedTransactions,
    failedUpdates,
  };
}
