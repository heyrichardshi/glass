import { Router } from "express";
import * as tags from "../controllers/tag.controller";
import {
  validateQuery,
  validateRequest,
  validateResponse,
} from "../middleware/validation";
import {
  CreateTagBodySchema,
  CreateTagResponseSchema,
  ListTagsQuerySchema,
  ListTagsResponseSchema,
} from "@glass/types/schemas";

const router = Router();

router.get(
  "/tags",
  validateQuery(ListTagsQuerySchema),
  validateResponse(ListTagsResponseSchema),
  tags.listTags,
);
router.post(
  "/tags",
  validateRequest(CreateTagBodySchema),
  validateResponse(CreateTagResponseSchema),
  tags.createTag,
);

export default router;
