import type {
  CreateMerchantRequest,
  ListMerchantsRequest,
  UpdateMerchantRequest,
} from "@saffron/types";
import useListMerchants from "./api/merchants/useListMerchants";
import useCreateMerchant from "./api/merchants/useCreateMerchant";
import useUpdateMerchant from "./api/merchants/useUpdateMerchant";

export default function () {
  const listMerchants = (request: ListMerchantsRequest) =>
    useListMerchants(request);
  const createMerchant = (request: CreateMerchantRequest) =>
    useCreateMerchant(request);
  const updateMerchant = (merchantId: string, request: UpdateMerchantRequest) =>
    useUpdateMerchant(merchantId, request);

  return {
    listMerchants,
    createMerchant,
    updateMerchant,
  };
}
