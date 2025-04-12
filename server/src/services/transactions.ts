import { TransactionsList } from "../models";
import { TransactionRepository } from "../repositories";

/**
 * Retrieves all transactions for a given user, in reverse chronological order.
 */
export async function listForUser(
  userId: string,
  paginationToken?: string,
): Promise<TransactionsList> {
  const transactionRepo = await TransactionRepository.getInstance();

  return transactionRepo.listTransactionsByUser(userId, paginationToken);
}
