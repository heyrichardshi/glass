<template>
  <UTable
    sticky
    :data="transactions"
    :columns="columns"
    class="flex-1 w-full"
    :loading="loading"
    @select="onSelect"
  >
    <template #description-cell="{ row }">
      <div>
        <div>{{ row.original.description }}</div>
        <div class="mt-1">
          <TagBadge v-for="tagId in row.original.tagIds" :key="tagId" :tagId="tagId" />
        </div>
      </div>
    </template>
  </UTable>
</template>

<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui";
import type { Category, Transaction } from "@saffron/types";
import EditTransaction from "./EditTransaction.vue";
import TagBadge from "../tag/TagBadge.vue";

const props = defineProps<{
  transactions: Transaction[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  updatedTransaction: [
    {
      index: number;
      transaction: Transaction;
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

const columns: TableColumn<Transaction>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      row.original.status == "pending"
        ? "Pending"
        : formatDisplayDate(row.getValue("date")),
  },
  {
    accessorKey: "categoryId",
    header: "Category",
    cell: ({ row }) => getCategoryById(row.getValue("categoryId"))?.name,
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      let amount = row.getValue("amount") as string;
      let isNegative = false;

      if (amount.startsWith("-")) {
        amount = amount.slice(1);
        isNegative = true;
      }

      // Parse the amount as a number and format to always show 2 decimal places
      const numericAmount = parseFloat(amount);
      const formattedAmount = numericAmount.toFixed(2);
      
      const prefix = isNegative ? "-" : "";
      const textColor = isNegative ? "text-emerald-600" : "";
      return h('div', { class: `text-right ${textColor}` }, `${prefix}\$${formattedAmount}`);
    },
  },
];

async function onSelect(row: TableRow<Transaction>, e?: Event) {
  console.log("onSelect", row, e);
  const editPane = overlay.create(EditTransaction, {
    props: {
      transaction: row.original,
    },
  });

  const instance = editPane.open();

  const editPaneResult = (await instance.result) as {
    newTransaction: Transaction;
  };

  emit("updatedTransaction", {
    index: row.index,
    transaction: editPaneResult.newTransaction,
  });
}
</script>
