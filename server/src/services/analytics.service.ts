import {
  CategoryTransactions,
  GetMonthlyReportRequest,
  GetMonthlyReportResponse,
  TagTransactions,
  Transaction,
} from "@glass/types";
import {
  AccountRepository,
  CategoryRepository,
  TagRepository,
  TransactionRepository,
} from "../repositories";
import { InvalidInputWithCustomMessageError } from "../common/errors";
import { indexById } from "../common/utils";
import { Category, Tag, toApiAccount, toApiTransaction } from "../models";
import { isExpenseCategory, isIncomeCategory } from "../models/category";

export async function getMonthlyReport(
  userId: string,
  request: GetMonthlyReportRequest,
): Promise<GetMonthlyReportResponse> {
  const { year, month } = request;

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
  const categoryRepo = await CategoryRepository.getInstance();
  const tagRepo = await TagRepository.getInstance();

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

  const categories = await categoryRepo.listAll(userId);
  const categoryIndex = indexById(categories, (item) => item);

  // key = category ID
  let categoryTransactionIndex: Record<string, CategoryTransactions> = {};

  const tags = await tagRepo.listAll(userId);
  const tagIndex = indexById(tags, (item) => item);

  // key = tag ID
  let tagTransactionIndex: Record<string, TagTransactions> = {};

  let totalIncomeInCents = 0;
  let totalExpenseInCents = 0;

  transactions.forEach((transaction) => {
    // Determine if the transaction is income or expense
    const categoryForTransaction = categoryIndex[transaction.categoryId];
    if (isIncomeCategory(categoryForTransaction)) {
      totalIncomeInCents += stringAmountToCents(transaction.amount);
    } else if (isExpenseCategory(categoryForTransaction)) {
      totalExpenseInCents += stringAmountToCents(transaction.amount);
    }

    // Add the transaction to respective indexes
    addTransactionToCategoryIndex(
      transaction,
      categoryTransactionIndex,
      categoryIndex,
    );
    addTransactionToTagIndex(transaction, tagTransactionIndex, tagIndex);
  });

  const { income: categoryIncome, expenses: categoryExpenses } =
    buildCategoryTransactionsArrays(categoryTransactionIndex, categoryIndex);

  return {
    year,
    month,
    totalIncome: centsToString(totalIncomeInCents),
    totalExpense: centsToString(totalExpenseInCents),
    categoryIncome,
    categoryExpenses,
    tagExpenses: Object.values(tagTransactionIndex),
    accounts: accountIndex,
    transactions: transactionIndex,
  };
}

function stringAmountToCents(amount: string): number {
  const parts = amount.split(".");
  let cents = parseInt(parts[0], 10) * 100; // dollars part
  if (parts.length > 1) {
    cents += parseInt(parts[1], 10); // cents part
  }
  return cents;
}

function centsToString(totalCents: number): string {
  const dollars = Math.floor(totalCents / 100);
  const cents = Math.abs(totalCents % 100);
  return `${dollars}.${cents.toString().padStart(2, "0")}`;
}

function addTransactionToCategoryIndex(
  transaction: Transaction,
  categoryTransactionIndex: Record<string, CategoryTransactions>,
  categoryIndex: Record<string, Category>,
) {
  // This can be undefined because we are traversing the category heirarchy, but it will always have an initial value
  // since the transaction categoryId always exists.
  let categoryId: string | undefined = transaction.categoryId;

  while (categoryId) {
    // Create the entry if the category ID doesn't exist
    if (!categoryTransactionIndex[categoryId]) {
      categoryTransactionIndex[categoryId] = {
        category: categoryIndex[categoryId],
        totalAmount: "0",
        transactionIds: [],
        subcategoryTransactions: [],
      };
    }

    // Add the transaction ID to the category's transaction list
    categoryTransactionIndex[categoryId].transactionIds.push(transaction.id);
    // Add the transaction amount to the category's total amount
    const currentCategoryTotal = stringAmountToCents(
      categoryTransactionIndex[categoryId].totalAmount,
    );
    const transactionAmount = stringAmountToCents(transaction.amount);
    categoryTransactionIndex[categoryId].totalAmount = centsToString(
      currentCategoryTotal + transactionAmount,
    );

    // Move up the category hierarchy to add this transaction to parent categories
    categoryId = categoryIndex[categoryId].parentId;
  }
}

function addTransactionToTagIndex(
  transaction: Transaction,
  tagTransactionIndex: Record<string, TagTransactions>,
  tagIndex: Record<string, Tag>,
) {
  for (const tagId of transaction.tagIds) {
    // Create the entry if the tag ID doesn't exist
    if (!tagTransactionIndex[tagId]) {
      tagTransactionIndex[tagId] = {
        tag: tagIndex[tagId],
        totalAmount: "0",
        transactionIds: [],
      };
    }

    // Add the transaction ID to the tag's transaction list
    tagTransactionIndex[tagId].transactionIds.push(transaction.id);

    // Add the transaction amount to the tag's total amount
    const currentTagTotal = stringAmountToCents(
      tagTransactionIndex[tagId].totalAmount,
    );
    const transactionAmount = stringAmountToCents(transaction.amount);
    tagTransactionIndex[tagId].totalAmount = centsToString(
      currentTagTotal + transactionAmount,
    );
  }
}

/**
 * Builds a heirarchical array of category transactions from the category transaction index.
 */
function buildCategoryTransactionsArrays(
  categoryTransactionIndex: Record<string, CategoryTransactions>,
  categoryIndex: Record<string, Category>,
): { income: CategoryTransactions[]; expenses: CategoryTransactions[] } {
  const income: CategoryTransactions[] = [];
  const expenses: CategoryTransactions[] = [];

  for (const [categoryId, categoryTransactions] of Object.entries(
    categoryTransactionIndex,
  )) {
    // Pull from the category index to get the full category object, since category in the CategoryTransactions
    // object is the API entity not the BE entity.
    const category = categoryIndex[categoryId];

    if (category.parentId === undefined) {
      // This is a root category, so add directly to the income or expenses array
      if (isIncomeCategory(category)) {
        income.push(categoryTransactions);
      } else if (isExpenseCategory(category)) {
        expenses.push(categoryTransactions);
      }
    } else {
      // This is a subcategory, so add to the parent category's subcategory transactions
      const parentCategoryId = category.parentId!!;
      categoryTransactionIndex[parentCategoryId].subcategoryTransactions.push(
        categoryTransactions,
      );
    }
  }

  return { income, expenses };
}
