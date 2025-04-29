import * as tags from "../services/tags";
import asyncController from "./asyncController";
import { InvalidInputError } from "../common/errors";

export const listTags = asyncController(async (req, res) => {
  const userId = req.query.userId as string | undefined; // ?userId=...
  console.log("userId:", userId);

  if (!userId) {
    throw new InvalidInputError("userId");
  }

  const tagsList = await tags.listTags({
    householdId: userId,
  });
  res.status(200).json(tagsList);
});

export const createTag = asyncController(async (req, res) => {
  const userId = req.query.userId as string | undefined; // ?userId=...
  const name = req.query.name as string | undefined; // ?name=...

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
  res.status(200).json(tag);
});
