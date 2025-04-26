import { Router } from "express";
import * as categories from "../controllers/categories";

const router = Router();

router.get("/categories", categories.listCategories);
router.post("/categories", categories.createCategory);

export default router;
