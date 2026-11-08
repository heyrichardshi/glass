import { describe, expect, it } from "vitest";
import type { Transaction } from "@glass/types";
import {
  findSimilarTransactions,
  tokenizeRawDescription,
} from "./transactionSimilarity";

function transaction(
  id: string,
  rawDescription: string,
  date = "2026-11-01",
): Transaction {
  return {
    id,
    userId: "user",
    accountId: "account",
    amount: "10.00",
    currency: "USD",
    rawDate: date,
    date,
    rawDescription,
    description: rawDescription,
    notes: "",
    status: "posted",
    counterparty: { id: "0", type: "merchant" },
    categoryId: "0",
    tagIds: [],
    linkedTransactionIds: [],
  };
}

describe("tokenizeRawDescription", () => {
  it("lowercases words and preserves internal apostrophes and dashes", () => {
    expect(tokenizeRawDescription("MCDONALD’S IN-N-OUT")).toEqual([
      "mcdonald's",
      "in-n-out",
    ]);
  });

  it("splits on whitespace and non-word symbols", () => {
    expect(tokenizeRawDescription("SQ *COFFEE/SHOP #1234")).toEqual([
      "sq",
      "coffee",
      "shop",
      "1234",
    ]);
  });
});

describe("findSimilarTransactions", () => {
  it("matches any exact token without including the current transaction", () => {
    const current = transaction("current", "SQ *Coffee Shop");
    const match = transaction("match", "COFFEE ROASTERS");
    const unrelated = transaction("unrelated", "Book Store");

    expect(
      findSimilarTransactions(current, [current, match, unrelated]).map(
        ({ id }) => id,
      ),
    ).toEqual(["match"]);
  });

  it("preserves the supplied month-task ordering", () => {
    const current = transaction("current", "Coffee");
    const newest = transaction("newest", "Coffee", "2026-11-20");
    const oldest = transaction("oldest", "Coffee", "2026-11-02");

    expect(
      findSimilarTransactions(current, [newest, oldest, current]).map(
        ({ id }) => id,
      ),
    ).toEqual(["newest", "oldest"]);
  });

  it("only considers candidates supplied by the monthly task queue", () => {
    const current = transaction("current", "Coffee");
    const sameMonthTask = transaction("same-month-task", "Coffee");

    expect(
      findSimilarTransactions(current, [sameMonthTask]).map(({ id }) => id),
    ).toEqual(["same-month-task"]);
    expect(findSimilarTransactions(current, [])).toEqual([]);
  });
});
