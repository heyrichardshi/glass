import { Category } from "./category";
import { Tag } from "./tag";

export interface CategoryTransactions {
  category: Category;
  totalAmount: string;
  transactionIds: string[];
  subcategoryTransactions: CategoryTransactions[];
}

export interface TagTransactions {
  tag: Tag;
  totalAmount: string;
  transactionIds: string[];
}
