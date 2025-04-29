import { Tag } from "../models/tag";

export interface ListTagsRequest {
  householdId: string;
}

export interface ListTagsResponse {
  tags: Tag[];
}

export interface CreateTagRequest {
  householdId: string;
  name: string;
}

export interface CreateTagResponse {
  tag: Tag;
}
