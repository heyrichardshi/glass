<template>
  <UBadge :label="name" color="neutral" variant="solid" class="mx-0.5" />
</template>

<script setup lang="ts">
const props = defineProps<{
  merchantId: string;
}>();

const merchantsApi = useMerchantsApi();
const listMerchants = merchantsApi.listMerchants();

const name = computed(() => {
  const merchant = listMerchants.merchants.value.find(
    (merchant) => merchant.id === props.merchantId,
  );
  return merchant?.name || "Unknown Merchant";
});
</script>
