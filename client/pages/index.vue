<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">My Transactions</h1>

    <TransactionTable :transactions="transactions" :loading="pending" />

    <!-- <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error loading transactions: {{ error.message }}</div>
    <div v-else>
      <TransactionItem
        v-for="tx in transactions"
        :key="tx.id"
        :transaction="tx"
      /> -->

    <button
      v-if="paginationToken"
      @click="loadMore"
      class="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Load More
    </button>
    <!-- </div> -->
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const userId = 0;

const transactions = ref<any[]>([]);
const paginationToken = ref<string | null>(null);

const { pending, error, refresh } = useFetch(
  () => `${config.public.SAFFRON_API_URL}/transactions`,
  {
    query: { userId },
    server: false,
    onResponse({ response }) {
      transactions.value = response._data.transactions;
      paginationToken.value = response._data.paginationToken ?? null;
    },
  },
);

async function loadMore() {
  const { data } = await useFetch(
    `${config.public.SAFFRON_API_URL}/transactions`,
    {
      query: {
        userId,
        paginationToken: paginationToken.value,
      },
      server: false,
    },
  );

  if (data.value) {
    transactions.value.push(...data.value.transactions);
    paginationToken.value = data.value.paginationToken ?? null;
  }
}
</script>
