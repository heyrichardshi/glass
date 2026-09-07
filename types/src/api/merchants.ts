import { Merchant } from "../models/merchant";

export interface ListMerchantsResponse {
  merchants: Merchant[];
}

export interface CreateMerchantRequest {
  name: string;
  defaultCategoryId: string;
  descriptionMatchers: string[];
}

export interface CreateMerchantResponse {
  merchant: Merchant;
}

export interface UpdateMerchantRequest {
  name?: string;
  defaultCategoryId?: string;
  descriptionMatchers?: string[];
}

export interface UpdateMerchantResponse {
  merchant: Merchant;
}
