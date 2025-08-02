import { Router } from "express";
import * as merchants from "../controllers/merchants";

const router = Router();

router.get("/merchants", merchants.listMerchants);
router.post("/merchants", merchants.createMerchant);
router.put("/merchants/:merchantId", merchants.updateMerchant);

export default router;
