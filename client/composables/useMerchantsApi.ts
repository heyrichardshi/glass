import type {
  CreateMerchantRequest,
  ListMerchantsRequest,
} from "@saffron/types";
import useListMerchants from "./api/merchants/useListMerchants";
import useCreateMerchant from "./api/merchants/useCreateMerchant";

export default function () {
  const listMerchants = (request: ListMerchantsRequest) =>
    useListMerchants(request);
  const createMerchant = (request: CreateMerchantRequest) =>
    useCreateMerchant(request);

  return {
    listMerchants,
    createMerchant,
  };
}
