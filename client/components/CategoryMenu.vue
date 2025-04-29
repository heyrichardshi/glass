<template>
  <UFormField :label="label">
    <UInputMenu
      v-model="selectedCategory"
      :items="allCategories"
      value-key="category"
      :create-item="props.allowCreate"
      @create="createCategory"
      :highlight="!props.disabled"
      :disabled="props.disabled"
      class="w-full"
    />
  </UFormField>
</template>

<script setup lang="ts">
import type { Category } from "@saffron/types";

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

  const result = (await createCategoryModal.open()) as { category?: Category };
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
