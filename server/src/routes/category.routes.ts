import { Router } from "express";
import * as categories from "../controllers/category.controller";
import {
  validateQuery,
  validateRequest,
  validateResponse,
} from "../middleware/validation";
import {
  CreateCategoryBodySchema,
  CreateCategoryResponseSchema,
  ListCategoriesQuerySchema,
  ListCategoriesResponseSchema,
} from "@saffron/types/schemas";

const router = Router();

router.get(
  "/categories",
  validateQuery(ListCategoriesQuerySchema),
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
