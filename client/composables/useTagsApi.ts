import useCreateTag from "./api/tags/useCreateTag";
import useListTags from "./api/tags/useListTags";

export default function () {
  const listTags = (userId: string) => useListTags(userId);
  const createTag = (userId: string, name: string) =>
    useCreateTag(userId, name);

  return { listTags, createTag };
}
