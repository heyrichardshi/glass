<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Transactions</h1>

    <TransactionSearchBox @search="onSearch" />

    <TransactionTable
      :transactions="transactions"
      :loading="pending"
      @updatedTransaction="updateTransaction"
    />

    <button
      v-if="paginationToken"
      @click="loadMore"
      class="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Load More
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Transaction, ListTransactionsResponse } from "@saffron/types";

const config = useRuntimeConfig();
const userId = 0;

const transactions = ref<Transaction[]>([]);
const paginationToken = ref<string | null>(null);
const isSearchMode = ref(false);

type SearchFilters = {
  searchText?: string;
  accountIds?: string[];
  merchantIds?: string[];
  categoryIds?: string[];
  tagIds?: string[];
};

const currentFilters = ref<SearchFilters | null>(null);

const transactionsApi = useTransactionsApi();

// initial list fetch
const initialList = transactionsApi.listTransactions({
  userId: String(userId),
});
const pending = computed(() => initialList.status.value === "pending");
watchEffect(() => {
  transactions.value = initialList.transactions.value as any[];
  paginationToken.value =
    (initialList.paginationToken.value as string | undefined) ?? null;
});

async function loadMore() {
  if (!isSearchMode.value) {
    const nextPage = transactionsApi.listTransactions({
      userId: String(userId),
      paginationToken: paginationToken.value || undefined,
    });
    await nextPage.refresh();
    if (nextPage.data.value) {
      transactions.value.push(...(nextPage.data.value.transactions || []));
      paginationToken.value = nextPage.data.value.paginationToken ?? null;
    }
  } else {
    const nextSearch = transactionsApi.searchTransactions({
      filters: currentFilters.value || {},
      paginationToken: paginationToken.value || undefined,
    });
    await nextSearch.refresh();
    if (nextSearch.data.value) {
      transactions.value.push(...(nextSearch.data.value.transactions || []));
      paginationToken.value = nextSearch.data.value.paginationToken ?? null;
    }
  }
}

function updateTransaction(tx: { index: number; transaction: Transaction }) {
  transactions.value[tx.index] = tx.transaction;
}

async function onSearch(filters: SearchFilters) {
  const areFiltersEmpty = (f: SearchFilters) =>
    !f.searchText &&
    (!f.accountIds || f.accountIds.length === 0) &&
    (!f.merchantIds || f.merchantIds.length === 0) &&
    (!f.categoryIds || f.categoryIds.length === 0) &&
    (!f.tagIds || f.tagIds.length === 0);

  if (areFiltersEmpty(filters)) {
    // Switch back to list mode
    isSearchMode.value = false;
    currentFilters.value = null;
    paginationToken.value = null;
    await initialList.refresh();
    transactions.value = initialList.transactions.value;
    return;
  }

  isSearchMode.value = true;
  currentFilters.value = filters;
  paginationToken.value = null;

  const searchResult = transactionsApi.searchTransactions({
    filters,
  });
  await searchResult.refresh();
  if (searchResult.data.value) {
    transactions.value = searchResult.data.value.transactions || [];
    paginationToken.value = searchResult.data.value.paginationToken ?? null;
  }
}
</script>
