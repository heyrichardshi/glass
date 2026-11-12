<template>
  <UBadge
    :label="name"
    icon="i-lucide-chart-pie"
    color="neutral"
    variant="outline"
    class="mx-0.5"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  categoryId: string;
}>();

const categoriesApi = useCategoriesApi();
const listCategories = categoriesApi.listCategories();

const name = computed(() => {
  const category = listCategories.categories.value.find(
    (category) => category.id === props.categoryId,
  );
  return category?.name || "Uncategorized";
});
</script>
