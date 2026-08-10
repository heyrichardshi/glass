<template>
  <UFormField :label="label">
    <UInputMenu
      v-model="selectedCategory"
      :items="allCategories"
      value-key="category"
      :ignore-filter="ignoreFilter"
      v-model:search-term="searchTerm"
      :create-item="props.allowCreate"
      @create="createCategory"
      :highlight="!props.disabled"
      :disabled="props.disabled"
      class="w-full"
    />
  </UFormField>
</template>

<script setup lang="ts">
import type { Category } from "@glass/types";

import CreateCategory from "./CreateCategory.vue";

const props = defineProps<{
  disabled?: boolean;
  allowCreate?: boolean;
  hideLabel?: boolean;
  prefillWithCategoryId?: string;
}>();

const emit = defineEmits<{
  selectedCategory: [Category | undefined];
}>();

const userId = "0";

const label = computed(() => {
  return props.hideLabel ? "" : "Category";
});

// The following block of code solves the problem where the search term is the prepopulated category name, thus when
// the menu is opened it only shows the selected category and its children.
// We specify a separate search term ref and set it to the empty string. However, this alone is not enough since the
// InputMenu will immediately change the search term back to the selected value, but on the second click the searchTerm
// ref will be updated back to the given initial value.
// Therefore, as soon as the first change is detected (from "" => preselected Category), we set the search term back to
// "" in order for the first click to show all categories.
// In order to only have this logic execute once, we use another ref that doubles to disable the native filtering until
// this logic is applied.
const ignoreFilter = ref(true);
const searchTerm = ref("");
watch(searchTerm, () => {
  if (ignoreFilter.value) {
    ignoreFilter.value = false;
    searchTerm.value = "";
  }
});
// End of code for previous comment.

const categoriesApi = useCategoriesApi();
const listCategories = categoriesApi.listCategories(userId);
const allCategories = computed(() => {
  return listCategories.categories.value
    .map((category) => ({
      label: category.fullPath.join(" › "),
      category: category,
    }))
    .sort((a, b) => (a.label < b.label ? -1 : 1));
});

const overlay = useOverlay();
async function createCategory(name: string) {
  console.log("Creating category: ", name);
  const createCategoryModal = overlay.create(CreateCategory, {
    props: {
      prefillName: name,
    },
  });

  const instance = createCategoryModal.open();
  const result = (await instance.result) as { category?: Category };
  if (result.category) {
    console.log("Created category: ", result.category);

    // Since a category was created, we want to refresh the global list of categories to keep everything in sync
    await listCategories.refresh();

    // Find the category in the new list and select it
    const newCategoryEntry = allCategories.value.find(
      (entry) => entry.category.id === result.category?.id,
    );

    if (!newCategoryEntry) {
      console.error("Created category not found in the list!");
      return;
    }

    selectedCategory.value = newCategoryEntry.category;
  }
}

const selectedCategory = ref<Category | undefined>(
  props.prefillWithCategoryId
    ? listCategories.categories.value.find(
        (category) => category.id === props.prefillWithCategoryId,
      )
    : undefined,
);

watch(
  selectedCategory,
  (newCategory) => {
    emit("selectedCategory", newCategory);
  },
  { immediate: true },
);
</script>
