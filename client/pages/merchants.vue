<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Merchants</h1>
      <UButton icon="i-lucide-plus" label="Create Merchant" disabled />
    </div>

    <MerchantTable :merchants="merchants" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const userId = "0";

const merchantsApi = useMerchantsApi();
const { merchants, status, refresh } = merchantsApi.listMerchants({
  householdId: userId,
});

const toast = useToast();

const loading = computed(() => status.value === "pending");
const error = computed(() =>
  status.value === "error" ? "Error loading merchants" : "",
);
</script>
