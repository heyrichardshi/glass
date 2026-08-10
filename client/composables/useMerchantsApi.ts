import type {
  CreateMerchantRequest,
  ListMerchantsRequest,
  UpdateMerchantRequest,
} from "@glass/types";
import useListMerchants from "./api/merchants/useListMerchants";
import useCreateMerchant from "./api/merchants/useCreateMerchant";
import useUpdateMerchant from "./api/merchants/useUpdateMerchant";
import useApplyAllMatchers from "./api/merchants/useApplyAllMatchers";

export default function () {
  const listMerchants = (request: ListMerchantsRequest) =>
    useListMerchants(request);
  const createMerchant = (request: CreateMerchantRequest) =>
    useCreateMerchant(request);
  const updateMerchant = (merchantId: string, request: UpdateMerchantRequest) =>
    useUpdateMerchant(merchantId, request);
  const applyAllMatchers = (request: {
    householdId: string;
    overrideExistingMerchants: boolean;
    overrideExistingCategories: boolean;
  }) => useApplyAllMatchers(request);

  return {
    listMerchants,
    createMerchant,
    updateMerchant,
    applyAllMatchers,
  };
}
