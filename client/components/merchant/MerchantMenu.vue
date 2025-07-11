<template>
  <UFormField :label="label">
    <UInputMenu
      v-model="selectedMerchant"
      :items="allMerchants"
      value-key="merchant"
      :ignore-filter="ignoreFilter"
      v-model:search-term="searchTerm"
      :create-item="props.allowCreate"
      @create="createMerchant"
      :highlight="!props.disabled"
      :disabled="props.disabled"
      class="w-full"
    />
  </UFormField>
</template>

<script setup lang="ts">
import type { Merchant } from "@saffron/types";

import CreateMerchant from "./CreateMerchant.vue";

const props = defineProps<{
  disabled?: boolean;
  allowCreate?: boolean;
  hideLabel?: boolean;
  prefillWithMerchantId?: string;
}>();

const emit = defineEmits<{
  selectedMerchant: [Merchant | undefined];
}>();

const userId = "0";

const label = computed(() => {
  return props.hideLabel ? "" : "Merchant";
});

// The following block of code solves the problem where the search term is the prepopulated merchant name, thus when
// the menu is opened it only shows the selected merchant and its children.
// We specify a separate search term ref and set it to the empty string. However, this alone is not enough since the
// InputMenu will immediately change the search term back to the selected value, but on the second click the searchTerm
// ref will be updated back to the given initial value.
// Therefore, as soon as the first change is detected (from "" => preselected Merchant), we set the search term back to
// "" in order for the first click to show all merchants.
// In order to only have this logic execute once, we use another ref that doubles to disable the native filtering until
// this logic is applied.
const ignoreFilter = ref(true);
const searchTerm = ref("");
watch(searchTerm, () => {
  if (ignoreFilter.value) {
    ignoreFilter.value = false;
    searchTerm.value = "";
  }
});
// End of code for previous comment.

const merchantsApi = useMerchantsApi();
const listMerchants = merchantsApi.listMerchants({ householdId: userId });
const allMerchants = computed(() => {
  return (
    listMerchants.merchants.value
      .map((merchant) => ({
        label: merchant.name,
        merchant: merchant,
      }))
      .sort((a, b) => (a.label < b.label ? -1 : 1)) || []
  );
});

const overlay = useOverlay();
async function createMerchant(name: string) {
  console.log("Creating merchant: ", name);
  const createMerchantModal = overlay.create(CreateMerchant, {
    props: {
      prefillName: name,
    },
  });

  const instance = createMerchantModal.open();
  const result = (await instance.result) as { merchant?: Merchant };
  if (result.merchant) {
    console.log("Created merchant: ", result.merchant);

    // Since a merchant was created, we want to refresh the global list of merchants to keep everything in sync
    await listMerchants.refresh();

    // Find the merchant in the new list and select it
    const newMerchantEntry = allMerchants.value.find(
      (entry) => entry.merchant.id === result.merchant?.id,
    );

    if (!newMerchantEntry) {
      console.error("Created merchant not found in the list!");
      return;
    }

    selectedMerchant.value = newMerchantEntry.merchant;
  }
}

const selectedMerchant = ref<Merchant | undefined>(
  props.prefillWithMerchantId
    ? listMerchants.merchants.value.find(
        (merchant) => merchant.id === props.prefillWithMerchantId,
      )
    : undefined,
);

watch(
  selectedMerchant,
  (newMerchant) => {
    emit("selectedMerchant", newMerchant);
  },
  { immediate: true },
);
</script>
