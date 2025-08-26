<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Merchants</h1>
      <UButton icon="i-lucide-plus" label="Create Merchant" disabled />
    </div>

    <MerchantTable
      :merchants="displayMerchants"
      :loading="loading"
      @updatedMerchants="onUpdatedMerchant"
    />
  </div>
</template>

<script setup lang="ts">
import type { Merchant } from "@saffron/types";
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

const displayMerchants = ref<Merchant[]>([]);
watch(
  merchants,
  (newMerchants) => {
    displayMerchants.value = newMerchants.slice();
  },
  { immediate: true },
);

function onUpdatedMerchant(payload: { index: number; merchant: Merchant }) {
  displayMerchants.value[payload.index] = payload.merchant;
}
</script>
