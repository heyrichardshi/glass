import {
  CreateTagRequest,
  CreateTagResponse,
  ListTagsRequest,
  ListTagsResponse,
} from "@saffron/types";
import { TagRepository } from "../repositories";
import { toApiTag } from "../models";
import { ConflictError } from "../common/errors";
import { randomUUID } from "crypto";

export async function listTags(
  request: ListTagsRequest,
): Promise<ListTagsResponse> {
  const tagRepository = await TagRepository.getInstance();
  const tags = await tagRepository.listAll(request.householdId);

  // Sort tags alphabetically by name
  const sortedTags = tags.sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );

  return {
    tags: sortedTags.map((tag) => toApiTag(tag)),
  };
}

export async function createTag(
  request: CreateTagRequest,
): Promise<CreateTagResponse> {
  const { householdId, name } = request;
  console.log(
    `createTag() called with householdId: ${householdId}, name: ${name}`,
  );

  const tagRepository = await TagRepository.getInstance();

  // Check if category with given name already exists
  const existing = await tagRepository.findByName(householdId, name);
  if (existing) {
    throw new ConflictError("Tag", name);
  }

  console.log(`No existing tag found with name: ${name}`);

  // Create the new category
  const newTag = await tagRepository.upsert({
    id: randomUUID(),
    name: name,
    householdId: householdId,
  });

  return {
    tag: toApiTag(newTag),
  };
}
