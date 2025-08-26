<template>
  <UModal :title="modalTitle" :close="{ onClick: () => close() }">
    <template #body>
      <UTable
        sticky
        :data="transactions"
        :columns="columns"
        class="w-full"
        :loading="isLoading"
      >
        <template #description-cell="{ row }">
          <div>
            <div>
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
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Transaction } from "@saffron/types";
import TagBadge from "../tag/TagBadge.vue";
import useSearchTransactions from "~/composables/api/transactions/useSearchTransactions";
import formatDisplayDate from "~/utils/formatDisplayDate";

type SearchFilters = {
  searchText?: string;
  accountIds?: string[];
  merchantIds?: string[];
  categoryIds?: string[];
  tagIds?: string[];
};

const props = defineProps<{
  filters: SearchFilters;
}>();

const emit = defineEmits<{
  close: [Record<string, never>];
}>();

function close() {
  emit("close", {});
}

const modalTitle = computed(() => {
  const text = props.filters.searchText?.trim();
  return text && text.length > 0
    ? `Search results for "${text}"`
    : "Search results";
});

const search = useSearchTransactions({ filters: props.filters });
const transactions = computed(() => search.transactions.value);
const isLoading = computed(() => search.status.value === "pending");

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

      const numericAmount = parseFloat(amount);
      const formattedAmount = numericAmount.toFixed(2);

      const prefix = isNegative ? "-" : "";
      const textColor = isNegative ? "text-emerald-600" : "";
      return h(
        "div",
        { class: `text-right ${textColor}` },
        `${prefix}\$${formattedAmount}`,
      );
    },
  },
];
</script>
