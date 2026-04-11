<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Merchants</h1>
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-refresh-cw"
          label="Apply All Matchers"
          color="neutral"
          variant="subtle"
          @click="openApplyAllMatchers"
        />
        <UButton
          icon="i-lucide-plus"
          label="Create Merchant"
          @click="openCreateMerchant"
        />
      </div>
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
import CreateMerchant from "../components/merchant/CreateMerchant.vue";
import ApplyAllMatchersModal from "../components/merchant/ApplyAllMatchersModal.vue";
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
const overlay = useOverlay();
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

async function openApplyAllMatchers() {
  const modal = overlay.create(ApplyAllMatchersModal, {});
  await modal.open().result;
}

async function openCreateMerchant() {
  const createModal = overlay.create(CreateMerchant, {
    props: {
      prefillName: "",
    },
  });

  const instance = createModal.open();
  const result = (await instance.result) as { merchant?: Merchant };

  if (result.merchant) {
    await refresh();
  }
}
</script>
