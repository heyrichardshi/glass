import { Router } from "express";
import * as merchants from "../controllers/merchants";
import {
  validateQuery,
  validateRequest,
  validateResponse,
} from "../middleware/validation";
import {
  CreateMerchantBodySchema,
  CreateMerchantResponseSchema,
  ListMerchantsQuerySchema,
  ListMerchantsResponseSchema,
  UpdateMerchantBodySchema,
  UpdateMerchantResponseSchema,
} from "@saffron/types/schemas";

const router = Router();

router.get(
  "/merchants",
  validateQuery(ListMerchantsQuerySchema),
  validateResponse(ListMerchantsResponseSchema),
  merchants.listMerchants,
);
router.post(
  "/merchants",
  validateRequest(CreateMerchantBodySchema),
  validateResponse(CreateMerchantResponseSchema),
  merchants.createMerchant,
);
router.put(
  "/merchants/:merchantId",
  validateRequest(UpdateMerchantBodySchema),
  validateResponse(UpdateMerchantResponseSchema),
  merchants.updateMerchant,
);

export default router;
