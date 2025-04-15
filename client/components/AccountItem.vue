<template>
  <div class="bg-white rounded-xl p-4 shadow mb-3 border border-gray-200">
    <div class="text-lg font-semibold">{{ account.name }}</div>
    <div class="text-sm text-gray-500">{{ account.type }}</div>
    <div class="text-sm text-gray-600">Balance: {{ account.balance }}</div>
  </div>
</template>

<script setup lang="ts">
import type { Account } from "@saffron/types";

defineProps<{
  account: Account;
}>();
</script>
