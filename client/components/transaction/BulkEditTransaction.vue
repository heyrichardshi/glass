<template>
  <USlideover
    :title="title"
    description="Set the merchant, category, and/or tags for these transactions."
    :close="{ onClick: () => close() }"
  >
    <template #body>
      <div class="grid grid-cols-2 gap-4">
        <!-- Merchant / Counterparty -->
        <!-- TODO: Need to toggle between account selector and merchant selector depending on the category -->
        <MerchantMenu allowCreate @selectedMerchant="selectedMerchant" />

        <!-- Category -->
        <CategoryMenu allowCreate @selectedCategory="selectedCategory" />

        <!-- Tags (full width) -->
        <TagMenu
          :prefillWithTagIds="[]"
          @selectedTags="selectedTags"
          class="col-span-full"
        />

        <UAlert
          color="error"
          :title="submitErrorMessage"
          v-if="submitError"
          class="col-span-full"
        />
      </div>
    </template>

    <template #footer>
      <UButton label="Clear" color="neutral" />
      <UButton
        label="Save"
        :disabled="!changesMade"
        :loading="requestInProgress"
        @click="commitChanges()"
      />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Category, Tag, Transaction, Merchant } from "@glass/types";

const props = defineProps<{
  transactions: Transaction[];
}>();

const emit = defineEmits<{
  close: [{ newTransactions?: Transaction[] }];
}>();

function close() {
  emit("close", {});
}

const title = computed(() => {
  const count = props.transactions.length;
  const transactionCountString = `${count} transaction${count !== 1 ? "s" : ""}`;
  return `Editing ${transactionCountString}`;
});

const editMerchant = ref<Merchant | undefined>();
function selectedMerchant(merchant: Merchant | undefined) {
  editMerchant.value = merchant;
}

const editCategory = ref<Category | undefined>();
function selectedCategory(category: Category | undefined) {
  editCategory.value = category;
}

const editTags = ref<Tag[]>([]);
function selectedTags(tags: Tag[]) {
  console.log("Selected tags updated: ", tags);
  editTags.value = tags;
}

const changesMade = computed(() => {
  return editCategory.value || editTags.value.length > 0 || editMerchant.value;
});

const transactionsApi = useTransactionsApi();
const toast = useToast();

const requestInProgress = ref(false);
const submitErrorMessage = ref("");
const submitError = computed(() => !!submitErrorMessage.value);

function commitChanges() {
  console.log("Save clicked");
  console.log("editCategory: ", editCategory.value);
  console.log("editTags: ", editTags.value);
  console.log("editMerchant: ", editMerchant.value);

  // Prepare updates object with only the fields that have been changed
  const updates: any = {};

  if (editCategory.value) {
    updates.categoryId = editCategory.value.id;
  }

  if (editTags.value.length > 0) {
    updates.tagIds = editTags.value.map((tag) => tag.id);
  }

  if (editMerchant.value) {
    updates.counterparty = {
      id: editMerchant.value.id,
      type: "merchant",
    };
  }

  // Only proceed if there are actual updates to make; shouldn't happen as the save button is disabled if there are no changes.
  if (Object.keys(updates).length === 0) {
    toast.add({
      title: "No changes to save",
      color: "warning",
      icon: "i-lucide-alert-triangle",
    });
    return;
  }

  const bulkUpdate = transactionsApi.bulkUpdateTransactions({
    transactionIds: props.transactions.map((t) => t.id),
    updates,
  });

  watch(
    bulkUpdate.status,
    (status) => {
      if (status === "success") {
        const response = bulkUpdate.response.value;
        if (response) {
          const successCount = response.updatedTransactions.length;
          const failedCount = response.failedUpdates.length;

          if (failedCount === 0) {
            toast.add({
              title: `Successfully updated ${successCount} transaction${successCount !== 1 ? "s" : ""}!`,
              color: "success",
              icon: "i-lucide-sparkles",
            });
          } else {
            toast.add({
              title: `Updated ${successCount} transaction${successCount !== 1 ? "s" : ""}, ${failedCount} failed`,
              color: "warning",
              icon: "i-lucide-alert-triangle",
            });
          }

          emit("close", { newTransactions: response.updatedTransactions });
        }
      } else if (status === "error") {
        submitErrorMessage.value =
          bulkUpdate.errorMessage.value || "An unknown error occurred.";
      }

      requestInProgress.value = status === "pending";
    },
    { immediate: true },
  );
}
</script>
