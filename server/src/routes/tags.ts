import { Router } from "express";
import * as tags from "../controllers/tags";

const router = Router();

router.get("/tags", tags.listTags);
router.post("/tags", tags.createTag);

export default router;
