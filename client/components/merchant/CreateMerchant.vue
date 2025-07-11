<template>
  <UModal title="Create a Merchant" :close="{ onClick: () => close() }">
    <template #body>
      <div class="grid grid-cols-1 gap-4">
        <UFormField label="Name">
          <UInput v-model="name" />
        </UFormField>

        <UFormField label="Default Category">
          <CategoryMenu
            hideLabel
            :prefillWithCategoryId="defaultCategoryId?.id"
            @selectedCategory="selectedCategory"
          />
        </UFormField>

        <UAlert color="error" :title="submitErrorMessage" v-if="submitError" />
      </div>
    </template>
    <template #footer>
      <div class="flex gap-2 justify-between w-full">
        <UButton color="neutral" label="Cancel" @click="close" />
        <UButton label="Create" @click="submit" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Category, Merchant } from "@saffron/types";

const props = defineProps<{
  prefillName: string;
}>();

const emit = defineEmits<{
  close: [{ merchant?: Merchant }];
}>();

const name = ref(props.prefillName);

// TODO: Set default category to be "Uncategorized"
const defaultCategoryId = ref<Category | undefined>(undefined);

const userId = "0";

const toast = useToast();

const merchantsApi = useMerchantsApi();

const requestInProgress = ref(false);
const submitErrorMessage = ref("");
const submitError = computed(() => !!submitErrorMessage.value);

function close() {
  emit("close", {});
}

function selectedCategory(category: Category | undefined) {
  defaultCategoryId.value = category;
}

function submit() {
  if (!defaultCategoryId.value?.id) {
    submitErrorMessage.value = "Please select a default category.";
    return;
  }

  const createMerchant = merchantsApi.createMerchant({
    householdId: userId,
    name: name.value,
    defaultCategoryId: defaultCategoryId.value.id,
    descriptionMatchers: [],
  });

  watch(
    createMerchant.status,
    (status) => {
      if (status === "success") {
        toast.add({
          title: `Created merchant "${name.value}"!`,
          color: "success",
          icon: "i-lucide-sparkles",
        });
        emit("close", { merchant: createMerchant.merchant.value });
      } else if (status === "error") {
        // Pipe the error message to the ref controlling the alert
        submitErrorMessage.value =
          createMerchant.errorMessage.value || "An unknown error occurred.";
      }

      // Disable the "Create" button while the request is in progress
      requestInProgress.value = status === "pending";
    },
    { immediate: true },
  );
}
</script>
