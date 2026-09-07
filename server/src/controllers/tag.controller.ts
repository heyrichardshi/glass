import * as tags from "../services/tag.service";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  CreateTagBody,
  CreateTagResponse,
  ListTagsResponse,
} from "@glass/types/schemas";

export const listTags = asyncController<
  NoParams,
  NoQuery,
  NoBody,
  ListTagsResponse
>(async (_req, res) => {
  const tagsList = await tags.listTags();
  res.status(200).json(tagsList);
});

export const createTag = asyncController<
  NoParams,
  NoQuery,
  CreateTagBody,
  CreateTagResponse
>(async (req, res) => {
  const { name } = req.body;

  const tag = await tags.createTag({ name });
  res.status(201).json(tag);
});
