<template>
  <UTable
    sticky
    ref="table"
    :data="transactions"
    :columns="columns"
    :column-visibility="columnVisibility"
    class="flex-1 w-full max-md:[&_table]:w-full max-md:[&_table]:min-w-0"
    :loading="loading"
    @select="onSelect"
  >
    <template #description-cell="{ row }">
      <div class="min-w-0 whitespace-normal">
        <div v-if="isCompact">
          <div class="flex items-baseline gap-2">
            <span class="shrink-0">
              {{
                row.original.status === "pending"
                  ? "Pending"
                  : formatDisplayDate(row.original.date)
              }}
            </span>
            <span class="min-w-0 break-words">
              {{ row.original.description }}
            </span>
          </div>

          <div class="mt-1 flex flex-wrap items-center gap-1">
            <MerchantBadge
              v-if="
                row.original.counterparty.type === 'merchant' &&
                row.original.counterparty.id != '0'
              "
              :merchantId="row.original.counterparty.id"
            />
            <CategoryBadge :categoryId="row.original.categoryId" />
          </div>
        </div>

        <div v-else class="break-words">
          <MerchantBadge
            v-if="
              row.original.counterparty.type === 'merchant' &&
              row.original.counterparty.id != '0'
            "
            :merchantId="row.original.counterparty.id"
          />

          {{ row.original.description }}
        </div>

        <div class="mt-1">
          <TagBadge
            v-for="tagId in row.original.tagIds"
            :key="tagId"
            :tagId="tagId"
          />
        </div>
      </div>
    </template>
  </UTable>

  <Transition
    enter-active-class="transition-opacity duration-300 ease-in-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300 ease-in-out"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="selectedTransactions.length > 0"
      class="sticky bottom-0 flex flex-col items-stretch justify-between gap-3 border-t border-accented px-4 py-3.5 text-sm text-muted backdrop-blur-lg sm:flex-row sm:items-center"
    >
      <span
        >{{ transactionCountString }} selected. Total:
        {{ transactionTotalString }}</span
      >

      <UButton
        :label="`Edit ${transactionCountString}`"
        @click="onBulkEdit()"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui";
import type { Category, Transaction } from "@glass/types";
import EditTransaction from "./EditTransaction.vue";
import BulkEditTransaction from "./BulkEditTransaction.vue";
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

const overlay = useOverlay();

const categoriesApi = useCategoriesApi();
const listCategories = categoriesApi.listCategories();

function getCategoryById(categoryId: string): Category | undefined {
  return listCategories.categories.value.find((c) => c.id === categoryId);
}

function getCategoryName(categoryId: string): string {
  return getCategoryById(categoryId)?.name ?? "Uncategorized";
}

const isCompact = ref(false);
let compactMediaQuery: MediaQueryList | undefined;

function updateCompactLayout() {
  isCompact.value = compactMediaQuery?.matches ?? false;
}

onMounted(() => {
  compactMediaQuery = window.matchMedia("(max-width: 767px)");
  updateCompactLayout();
  compactMediaQuery.addEventListener("change", updateCompactLayout);
});

onBeforeUnmount(() => {
  compactMediaQuery?.removeEventListener("change", updateCompactLayout);
});

const columnVisibility = computed(() => ({
  date: !isCompact.value,
  categoryId: !isCompact.value,
}));

const UCheckbox = resolveComponent("UCheckbox");
const table = useTemplateRef<{
  tableApi: {
    getFilteredSelectedRowModel: () => { rows: { original: Transaction }[] };
  };
}>("table");
const selectedTransactions = computed<Transaction[]>(() => {
  return (
    table.value?.tableApi
      ?.getFilteredSelectedRowModel()
      .rows.map((row: { original: Transaction }) => row.original) || []
  );
});
const transactionCountString = computed<string>(() => {
  const count = selectedTransactions.value.length;
  return `${count} transaction${count !== 1 ? "s" : ""}`;
});
const transactionTotalString = computed<string>(() => {
  const total = selectedTransactions.value.reduce(
    (acc: number, transaction: Transaction) =>
      acc + parseFloat(transaction.amount),
    0,
  );
  return `\$${total.toFixed(2)}`;
});

const columns: TableColumn<Transaction>[] = [
  {
    id: "select",
    meta: {
      class: {
        th: "max-md:w-12 max-md:pe-1 max-md:ps-3",
        td: "max-md:w-12 max-md:pe-1 max-md:ps-3",
      },
    },
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? "indeterminate"
          : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          table.toggleAllPageRowsSelected(!!value),
        "aria-label": "Select all",
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          row.toggleSelected(!!value),
        "aria-label": "Select row",
      }),
  },
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
    cell: ({ row }) => getCategoryName(row.getValue("categoryId")),
  },
  {
    accessorKey: "description",
    header: () => (isCompact.value ? "Transaction" : "Description"),
    meta: {
      class: {
        th: "max-md:whitespace-normal max-md:[overflow-wrap:anywhere]",
        td: "max-md:whitespace-normal max-md:[overflow-wrap:anywhere]",
      },
    },
  },
  {
    accessorKey: "amount",
    meta: {
      class: {
        th: "max-md:w-28 max-md:pe-3 max-md:ps-2",
        td: "max-md:w-28 max-md:pe-3 max-md:ps-2",
      },
    },
    header: () => h("div", { class: "text-right" }, "Amount"),
    cell: ({ row }) => {
      let amount = row.getValue("amount") as string;
      let isNegative = false;

      if (amount.startsWith("-")) {
        amount = amount.slice(1);
        isNegative = true;
      }

      const numericAmount = parseFloat(amount);
      const formattedAmount = numericAmount.toFixed(2);

      const prefix = isNegative ? "-" : "";
      const textColor = isNegative ? "text-emerald-600" : "";
      return h(
        "div",
        { class: `whitespace-nowrap text-right ${textColor}` },
        `${prefix}\$${formattedAmount}`,
      );
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

async function onBulkEdit() {
  const bulkEditPane = overlay.create(BulkEditTransaction, {
    props: {
      transactions: selectedTransactions.value,
    },
  });

  const instance = bulkEditPane.open();

  const bulkEditPaneResult = (await instance.result) as {
    newTransactions: Transaction[];
  };

  // TODO: Update the table with the new transactions.
  //   To do so, we need to modify the emit of the table to support multiple transactions.
  // emit("updatedTransactions", bulkEditPaneResult.newTransactions);
}
</script>
