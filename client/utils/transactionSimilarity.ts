import type { Transaction } from "@glass/types";

const WORD_TOKEN = /[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu;

export function tokenizeRawDescription(description: string): string[] {
  return (
    description
      .toLowerCase()
      .replaceAll("’", "'")
      .replace(/[\u2010-\u2015]/g, "-")
      .match(WORD_TOKEN) ?? []
  );
}

export function findSimilarTransactions(
  transaction: Transaction,
  monthlyTasks: Transaction[],
): Transaction[] {
  const transactionTokens = new Set(
    tokenizeRawDescription(transaction.rawDescription),
  );

  if (transactionTokens.size === 0) {
    return [];
  }

  return monthlyTasks.filter((candidate) => {
    if (candidate.id === transaction.id) {
      return false;
    }

    return tokenizeRawDescription(candidate.rawDescription).some((token) =>
      transactionTokens.has(token),
    );
  });
}
