import { describe, expect, it } from "vitest";
import type { Transaction } from "@glass/types";
import {
  getTaskDateRanges,
  isMissingMerchant,
  isUncategorized,
  needsAttention,
} from "./transactionTasks";

function transaction(
  categoryId: string,
  counterparty: Transaction["counterparty"],
): Transaction {
  return {
    id: "transaction",
    userId: "user",
    accountId: "account",
    amount: "10.00",
    currency: "USD",
    rawDate: "2026-11-01",
    date: "2026-11-01",
    rawDescription: "Description",
    description: "Description",
    notes: "",
    status: "posted",
    counterparty,
    categoryId,
    tagIds: [],
    linkedTransactionIds: [],
  };
}

describe("transaction task predicates", () => {
  it("includes uncategorized transactions", () => {
    const value = transaction("0", { id: "merchant", type: "merchant" });

    expect(isUncategorized(value)).toBe(true);
    expect(needsAttention(value)).toBe(true);
  });

  it("includes transactions with the placeholder merchant", () => {
    const value = transaction("category", { id: "0", type: "merchant" });

    expect(isMissingMerchant(value)).toBe(true);
    expect(needsAttention(value)).toBe(true);
  });

  it("does not treat account counterparties as missing merchants", () => {
    const value = transaction("category", { id: "0", type: "account" });

    expect(isMissingMerchant(value)).toBe(false);
    expect(needsAttention(value)).toBe(false);
  });

  it("excludes transactions with both a category and merchant", () => {
    const value = transaction("category", {
      id: "merchant",
      type: "merchant",
    });

    expect(needsAttention(value)).toBe(false);
  });
});

describe("getTaskDateRanges", () => {
  it("keeps the queue monthly and spans the selected month plus the prior eleven months", () => {
    expect(getTaskDateRanges("2026", "11")).toEqual({
      monthRange: {
        startDate: "2026-11-01",
        endDate: "2026-11-30",
      },
      annualRange: {
        startDate: "2025-12-01",
        endDate: "2026-11-30",
      },
    });
  });

  it("handles year boundaries and leap years", () => {
    expect(getTaskDateRanges("2024", "02")).toEqual({
      monthRange: {
        startDate: "2024-02-01",
        endDate: "2024-02-29",
      },
      annualRange: {
        startDate: "2023-03-01",
        endDate: "2024-02-29",
      },
    });
  });

  it("rejects invalid months", () => {
    expect(getTaskDateRanges("2026", "13")).toBeUndefined();
  });
});
