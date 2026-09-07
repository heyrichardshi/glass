import { Router } from "express";
import * as categories from "../controllers/category.controller";
import { validateRequest, validateResponse } from "../middleware/validation";
import {
  CreateCategoryBodySchema,
  CreateCategoryResponseSchema,
  ListCategoriesResponseSchema,
} from "@glass/types/schemas";

const router = Router();

router.get(
  "/categories",
  validateResponse(ListCategoriesResponseSchema),
  categories.listCategories,
);
router.post(
  "/categories",
  validateRequest(CreateCategoryBodySchema),
  validateResponse(CreateCategoryResponseSchema),
  categories.createCategory,
);

export default router;
