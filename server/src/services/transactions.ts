import {
  ListTransactionsResponse,
  UpdateTransactionRequest,
  UpdateTransactionResponse,
} from "@saffron/types";
import { TransactionRepository, TagRepository } from "../repositories";
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
  const tagRepo = await TagRepository.getInstance();

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
      const tags = await tagRepo.listAll(request.userId);
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
