import type { Transaction } from "@glass/types";

export const UNCATEGORIZED_CATEGORY_ID = "0";
export const MISSING_MERCHANT_ID = "0";

export type TransactionDateRange = {
  startDate: string;
  endDate: string;
};

export function getTaskDateRanges(
  yearValue: string,
  monthValue: string,
):
  | {
      monthRange: TransactionDateRange;
      annualRange: TransactionDateRange;
    }
  | undefined {
  const year = Number(yearValue);
  const month = Number(monthValue);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return undefined;
  }

  const paddedMonth = month.toString().padStart(2, "0");
  const endDay = new Date(Date.UTC(year, month, 0))
    .getUTCDate()
    .toString()
    .padStart(2, "0");
  const annualStart = new Date(Date.UTC(year, month - 12, 1));
  const annualStartYear = annualStart.getUTCFullYear();
  const annualStartMonth = (annualStart.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0");

  return {
    monthRange: {
      startDate: `${year}-${paddedMonth}-01`,
      endDate: `${year}-${paddedMonth}-${endDay}`,
    },
    annualRange: {
      startDate: `${annualStartYear}-${annualStartMonth}-01`,
      endDate: `${year}-${paddedMonth}-${endDay}`,
    },
  };
}

export function isUncategorized(transaction: Transaction): boolean {
  return transaction.categoryId === UNCATEGORIZED_CATEGORY_ID;
}

export function isMissingMerchant(transaction: Transaction): boolean {
  return (
    transaction.counterparty.type === "merchant" &&
    transaction.counterparty.id === MISSING_MERCHANT_ID
  );
}

export function needsAttention(transaction: Transaction): boolean {
  return isUncategorized(transaction) || isMissingMerchant(transaction);
}
