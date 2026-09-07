import useCreateTag from "./api/tags/useCreateTag";
import useListTags from "./api/tags/useListTags";

export default function () {
  const listTags = () => useListTags();
  const createTag = (name: string) => useCreateTag(name);

  return { listTags, createTag };
}
