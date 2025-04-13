<template>
  <div
    class="w-full rounded-xl bg-gray-100 p-4 flex items-center justify-between shadow-sm mb-2"
  >
    <div class="text-sm text-gray-600">{{ formattedDate }}</div>
    <div
      class="text-base font-medium text-gray-800 truncate mx-4 flex-1 text-center"
    >
      {{ transaction.description }}
    </div>
    <div class="text-sm font-semibold text-right text-gray-900">
      {{ formattedAmount }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transaction } from "@saffron/types";

const props = defineProps<{
  transaction: Transaction;
}>();

const formattedDate = computed(() =>
  new Date(props.transaction.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }),
);

const formattedAmount = computed(() => props.transaction.amount);
</script>
