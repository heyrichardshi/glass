import useCreateCategory from "./api/categories/useCreateCategory";
import useListCategories from "./api/categories/useListCategories";

export default function () {
  const listCategories = () => useListCategories();
  const createCategory = (name: string, parentId?: string) =>
    useCreateCategory(name, parentId);

  return { listCategories, createCategory };
}
