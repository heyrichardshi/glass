<template>
  <UTable
    sticky
    :data="merchants"
    :columns="columns"
    class="flex-1 w-full"
    :loading="loading"
    @select="onSelect"
  >
    <template #descriptionMatchers-cell="{ row }">
      <div class="flex flex-wrap gap-1">
        <UBadge
          v-for="(matcher, index) in row.original.descriptionMatchers"
          :key="index"
          color="neutral"
          variant="outline"
          size="sm"
          class="mx-0.5"
        >
          {{ matcher }}
        </UBadge>
        <span
          v-if="row.original.descriptionMatchers.length === 0"
          class="text-gray-400 italic text-sm"
        >
          No matchers
        </span>
      </div>
    </template>
  </UTable>
</template>

<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui";
import type { Merchant, Category } from "@saffron/types";

const props = defineProps<{
  merchants: Merchant[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  updatedMerchants: [
    {
      index: number;
      merchant: Merchant;
    },
  ];
}>();

const userId = "0";

const overlay = useOverlay();

const categoriesApi = useCategoriesApi();
const listCategories = categoriesApi.listCategories(userId);

function getCategoryById(categoryId: string): Category | undefined {
  return listCategories.categories.value.find((c) => c.id === categoryId);
}

function onSelect(row: TableRow<Merchant>, e?: Event) {
  console.log("onSelect", row, e);
}

const columns: TableColumn<Merchant>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.getValue("name"),
  },
  {
    accessorKey: "defaultCategoryId",
    header: "Default Category",
    cell: ({ row }) => getCategoryById(row.getValue("defaultCategoryId"))?.name,
  },
  {
    accessorKey: "descriptionMatchers",
    header: "Matchers",
  },
];
</script>
