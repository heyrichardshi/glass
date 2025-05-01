import {
  GetMonthlyReportRequest,
  GetMonthlyReportResponse,
  Transaction,
} from "@saffron/types";
import {
  AccountRepository,
  CategoryRepository,
  TagRepository,
  TransactionRepository,
} from "../repositories";
import { InvalidInputWithCustomMessageError } from "../common/errors";
import { indexById } from "../common/utils";
import { toApiAccount, toApiTransaction } from "../models";

export async function getMonthlyReport(
  request: GetMonthlyReportRequest,
): Promise<GetMonthlyReportResponse> {
  const { userId, year, month } = request;

  // Ensure a valid year and month are passed in
  if (!/^\d{4}$/.test(year)) {
    throw new InvalidInputWithCustomMessageError("Invalid year.");
  }
  if (!/^(0?[1-9]|1[0-2])$/.test(month)) {
    throw new InvalidInputWithCustomMessageError("Invalid month.");
  }

  console.log(
    `Getting monthly report for userId: ${userId}, year: ${year}, month: ${month}`,
  );

  // Get the first and last days of the month
  const y = Number(year);
  const m = Number(month) - 1; // months are 0-indexed

  const firstDay = new Date(Date.UTC(y, m, 1));
  const lastDay = new Date(Date.UTC(y, m + 1, 0)); // Day 0 of next month = last day of this one

  console.log(`Fetching transactions from ${firstDay} to ${lastDay}`);

  const accountRepo = await AccountRepository.getInstance();
  const transactionRepo = await TransactionRepository.getInstance();

  const accounts = await accountRepo.listByUser(userId);
  const accountIndex = indexById(accounts, toApiAccount);

  const transactions = await transactionRepo.listByDateRange(
    userId,
    firstDay,
    lastDay,
  );
  const transactionIndex = indexById(transactions, toApiTransaction);
  console.log(
    `Fetched ${transactions.length} transactions for userId: ${userId}, year: ${year}, month: ${month}`,
  );

  const totalExpense = sumAllTransactions(transactions);

  return {
    year,
    month,
    totalIncome: "0",
    totalExpense: totalExpense,
    categoryIncome: [],
    categoryExpenses: [],
    tagExpenses: [],
    accounts: accountIndex,
    transactions: transactionIndex,
  };
}

function sumAllTransactions(transactions: Transaction[]): string {
  const totalInCents = transactions
    .map((transaction) => Math.round(parseFloat(transaction.amount) * 100))
    .reduce((sum, amount) => sum + amount, 0);

  const dollarAmount = Math.floor(totalInCents / 100);
  const centAmount = Math.abs(totalInCents % 100);

  return `${dollarAmount}.${centAmount.toString().padStart(2, "0")}`;
}
