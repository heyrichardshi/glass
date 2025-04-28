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

  const isSuccess = await createCategoryModal.open();
  console.log("isSuccess: ", isSuccess);
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
