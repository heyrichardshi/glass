import * as tags from "../services/tag.service";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  CreateTagBody,
  CreateTagResponse,
  ListTagsQuery,
  ListTagsResponse,
} from "@saffron/types/schemas";

export const listTags = asyncController<
  NoParams,
  ListTagsQuery,
  NoBody,
  ListTagsResponse
>(async (req, res) => {
  const { userId } = req.query;

  const tagsList = await tags.listTags({
    householdId: userId,
  });
  res.status(200).json(tagsList);
});

export const createTag = asyncController<
  NoParams,
  NoQuery,
  CreateTagBody,
  CreateTagResponse
>(async (req, res) => {
  const { userId, name } = req.body;

  const tag = await tags.createTag({
    householdId: userId,
    name,
  });
  res.status(201).json(tag);
});
