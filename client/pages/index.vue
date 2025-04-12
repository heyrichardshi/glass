<template>
  <div>
    <h1>My Transactions</h1>

    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error loading transactions: {{ error.message }}</div>
    <div v-else>
      <ul>
        <li
          v-for="tx in transactions"
          :key="tx.id"
        >
          <div>{{ tx.description }}</div>
          <div>
            {{ formatDate(tx.date) }} — {{ formatAmount(tx.amount) }}
          </div>
        </li>
      </ul>

      <button
        v-if="paginationToken"
        @click="loadMore"
      >
        Load More
      </button>
    </div>
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

function formatAmount(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}
</script>
