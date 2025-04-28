import useListCategories from "./api/categories/useListCategories";

export default function () {
  const listCategories = (userId: string) => useListCategories(userId);

  return { listCategories };
}
