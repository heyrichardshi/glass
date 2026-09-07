<template>
  <UModal
    title="Apply All Matchers"
    :close="{ onClick: () => emit('close', {}) }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-gray-500">
          Apply all merchant description matchers to existing transactions.
          Transactions with no current merchant will always be matched.
        </p>

        <UCheckbox
          v-model="overrideExistingMerchants"
          label="Override existing merchants"
          description="Re-tag transactions that already have a merchant assigned"
        />

        <UCheckbox
          v-model="overrideExistingCategories"
          label="Override existing categories"
          description="Update each matched transaction's category to the merchant's default"
        />

        <UAlert
          color="error"
          :title="errorMessage"
          v-if="errorMessage"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-between w-full">
        <UButton
          color="neutral"
          label="Cancel"
          @click="emit('close', {})"
        />
        <UButton
          label="Run"
          :loading="requestInProgress"
          @click="run"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  close: [{ retaggedCount?: number }];
}>();

const overrideExistingMerchants = ref(false);
const overrideExistingCategories = ref(false);

const merchantsApi = useMerchantsApi();
const toast = useToast();

const requestInProgress = ref(false);
const errorMessage = ref("");

function run() {
  requestInProgress.value = true;
  errorMessage.value = "";

  const result = merchantsApi.applyAllMatchers({
    overrideExistingMerchants: overrideExistingMerchants.value,
    overrideExistingCategories: overrideExistingCategories.value,
  });

  watch(
    result.status,
    (status) => {
      if (status === "success") {
        const count = result.retaggedCount.value ?? 0;
        toast.add({
          title: `Applied matchers to ${count} transaction${count === 1 ? "" : "s"}`,
          color: "success",
          icon: "i-lucide-sparkles",
        });
        emit("close", { retaggedCount: count });
      } else if (status === "error") {
        errorMessage.value =
          result.errorMessage.value || "An unknown error occurred.";
        requestInProgress.value = false;
      }
    },
    { immediate: true },
  );
}
</script>
