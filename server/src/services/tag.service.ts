import { CreateTagResponse, ListTagsResponse } from "@glass/types";
import { TagRepository } from "../repositories";
import { toApiTag } from "../models";
import { ConflictError } from "../common/errors";
import { randomUUID } from "crypto";

export interface CreateTagRequest {
  name: string;
}

export async function listTags(): Promise<ListTagsResponse> {
  const tagRepository = await TagRepository.getInstance();
  const tags = await tagRepository.listAll();

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
  const { name } = request;
  console.log(`createTag() called with name: ${name}`);

  const tagRepository = await TagRepository.getInstance();

  // Check if category with given name already exists
  const existing = await tagRepository.findByName(name);
  if (existing) {
    throw new ConflictError(`Tag with name '${name}' already exists.`);
  }

  console.log(`No existing tag found with name: ${name}`);

  // Create the new category
  const newTag = await tagRepository.upsert({
    id: randomUUID(),
    name: name,
  });

  return {
    tag: toApiTag(newTag),
  };
}
