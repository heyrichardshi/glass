import { Merchant } from "../models/merchant";

export interface ListMerchantsRequest {
  householdId: string;
}

export interface ListMerchantsResponse {
  merchants: Merchant[];
}

export interface CreateMerchantRequest {
  householdId: string;
  name: string;
  defaultCategoryId: string;
  descriptionMatchers: string[];
}

export interface CreateMerchantResponse {
  merchant: Merchant;
}

export interface UpdateMerchantRequest {
  householdId: string;
  name?: string;
  defaultCategoryId?: string;
  descriptionMatchers?: string[];
}

export interface UpdateMerchantResponse {
  merchant: Merchant;
}
