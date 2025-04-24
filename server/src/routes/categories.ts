import { Router } from "express";
import * as categories from "../controllers/categories";

const router = Router();

router.get("/categories", categories.listCategories);

export default router;
