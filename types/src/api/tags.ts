import { Tag } from "../models/tag";

export interface ListTagsResponse {
  tags: Tag[];
}

export interface CreateTagRequest {
  name: string;
}

export interface CreateTagResponse {
  tag: Tag;
}
