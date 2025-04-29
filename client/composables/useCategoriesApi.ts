import useCreateCategory from "./api/categories/useCreateCategory";
import useListCategories from "./api/categories/useListCategories";

export default function () {
  const listCategories = (userId: string) => useListCategories(userId);
  const createCategory = (userId: string, name: string, parentId?: string) =>
    useCreateCategory(userId, name, parentId);

  return { listCategories, createCategory };
}
