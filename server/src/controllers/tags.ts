import * as tags from "../services/tags";
import asyncController from "./asyncController";
import { InvalidInputError } from "../common/errors";

export const listTags = asyncController(async (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    throw new InvalidInputError("userId");
  }

  const tagsList = await tags.listTags({
    householdId: userId,
  });
  res.status(200).json(tagsList);
});

export const createTag = asyncController(async (req, res) => {
  const { userId, name } = req.body;

  if (!userId) {
    throw new InvalidInputError("userId");
  }

  if (!name) {
    throw new InvalidInputError("name");
  }

  const tag = await tags.createTag({
    householdId: userId,
    name,
  });
  res.status(201).json(tag);
});
