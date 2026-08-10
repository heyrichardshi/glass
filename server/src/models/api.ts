import * as apiTypes from "@glass/types";
import { Category } from "./category";
import { Tag } from "./tag";
import { Account } from "./account";
import { Transaction } from "./transaction";
import { Merchant } from "./merchant";

export function toApiAccount(account: Account): apiTypes.Account {
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    institution: account.institution,
    balance: account.balance,
    mask: account.mask,
    officialName: account.officialName,
    transactionsLastRefreshedAt: account.transactionsLastRefreshedAt,
    type: account.type,
    status: account.status,
  };
}

export function toApiTransaction(
  transaction: Transaction,
): apiTypes.Transaction {
  return {
    id: transaction.id,
    userId: transaction.userId,
    householdId: transaction.householdId,
    accountId: transaction.accountId,
    amount: transaction.amount,
    currency: transaction.currency,
    rawDate: transaction.rawDate,
    date: transaction.date,
    rawDescription: transaction.rawDescription,
    description: transaction.description,
    notes: transaction.notes,
    status: transaction.status,
    counterparty: transaction.counterparty,
    categoryId: transaction.categoryId,
    tagIds: transaction.tagIds,
    linkedTransactionIds: transaction.linkedTransactionIds,
  };
}

export function toApiCategory(category: Category): apiTypes.Category {
  return {
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    fullPath: category.fullPath,
    isDefault: category.isDefault,
  };
}

export function toApiTag(tag: Tag): apiTypes.Tag {
  return {
    id: tag.id,
    name: tag.name,
    householdId: tag.householdId,
  };
}

export function toApiMerchant(merchant: Merchant): apiTypes.Merchant {
  return {
    id: merchant.id,
    name: merchant.name,
    defaultCategoryId: merchant.defaultCategoryId,
    descriptionMatchers: merchant.descriptionMatchers,
  };
}
