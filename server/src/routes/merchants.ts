import { Router } from "express";
import * as merchants from "../controllers/merchants";

const router = Router();

router.get("/merchants", merchants.listMerchants);
router.post("/merchants", merchants.createMerchant);

export default router;
