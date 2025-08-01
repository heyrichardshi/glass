<template>
  <USlideover
    title="Edit Transaction"
    :description="editPanelDescription"
    :close="{ onClick: () => close() }"
  >
    <template #body>
      <div class="grid grid-cols-2 gap-4">
        <!-- Date -->
        <DatePicker
          :prefillWithDate="transaction.date"
          @selectedDate="selectedDate"
        />

        <!-- Merchant / Counterparty -->
        <!-- TODO: Need to toggle between account selector and merchant selector depending on the category -->
        <MerchantMenu allowCreate @selectedMerchant="selectedMerchant" />

        <!-- Description (full width)-->
        <UFormField label="Description" class="col-span-full">
          <UInput v-model="editDescription" class="w-full" />
          <p class="text-xs italic text-gray-500 mt-1">
            Appears on your statement as:
            <br />
            {{ transaction.rawDescription }}
          </p>
        </UFormField>

        <!-- Category -->
        <CategoryMenu
          allowCreate
          :prefillWithCategoryId="transaction.categoryId"
          @selectedCategory="selectedCategory"
        />

        <!-- Tags -->
        <TagMenu
          :prefillWithTagIds="transaction.tagIds"
          @selectedTags="selectedTags"
        />

        <!-- Notes (full width)-->
        <UFormField
          label="Notes"
          description="Add any extra information here; will not show up in searches."
          class="col-span-full"
        >
          <UTextarea v-model="editNotes" autoresize class="w-full" />
        </UFormField>

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
        :loading="requestInProgress"
        @click="commitChanges()"
      />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Category, Tag, Transaction, Merchant } from "@saffron/types";

const props = defineProps<{
  transaction: Transaction;
}>();

const emit = defineEmits<{
  close: [{ newTransaction?: Transaction }];
}>();

function close() {
  emit("close", {});
}

const userId = "0";

const accountsApi = useAccountsApi();
const listAccountsResponse = accountsApi.listAccounts(userId);

const formattedAmount = computed(() => `$${props.transaction.amount}`);

const editPanelDescription = computed(() => {
  const prefix = props.transaction.status === "pending" ? "Pending " : "";
  const description = props.transaction.description;
  const date = formatDisplayDate(props.transaction.date);
  const accountName =
    listAccountsResponse.accounts.value.find(
      (acc) => acc.id == props.transaction.accountId,
    )?.name || "Unknown Account";
  return `${prefix}${formattedAmount.value} for ${description} on ${date} via ${accountName}`;
});

const editDate = ref("");
function selectedDate(date: string) {
  editDate.value = date;
}

const editMerchant = ref<Merchant | undefined>();
function selectedMerchant(merchant: Merchant | undefined) {
  editMerchant.value = merchant;
}

const editDescription = ref(props.transaction.description);

const editCategory = ref<Category | undefined>();
function selectedCategory(category: Category | undefined) {
  editCategory.value = category;
}

const editTags = ref<Tag[]>([]);
function selectedTags(tags: Tag[]) {
  console.log("Selected tags updated: ", tags);
  editTags.value = tags;
}

const editNotes = ref(props.transaction.notes);

const transactionsApi = useTransactionsApi();
const toast = useToast();

const requestInProgress = ref(false);
const submitErrorMessage = ref("");
const submitError = computed(() => !!submitErrorMessage.value);

function commitChanges() {
  console.log("Save clicked");
  console.log("editCategory: ", editCategory.value);
  console.log("editTags: ", editTags.value);
  console.log("editDate: ", editDate.value);
  console.log("editDescription: ", editDescription.value);
  console.log("editNotes: ", editNotes.value);
  console.log("editMerchant: ", editMerchant.value);

  const updateTransaction = transactionsApi.updateTransaction({
    userId,
    transactionId: props.transaction.id,
    date: editDate.value,
    description: editDescription.value,
    categoryId: editCategory.value?.id,
    tagIds: editTags.value.map((tag) => tag.id),
    notes: editNotes.value,
    // TODO: when account/merchant selector is implemented, need to determine which value to use
    counterparty: editMerchant.value
      ? {
          id: editMerchant.value.id,
          type: "merchant",
        }
      : undefined,
  });

  watch(
    updateTransaction.status,
    (status) => {
      if (status === "success") {
        toast.add({
          title: "Updated transaction!",
          color: "success",
          icon: "i-lucide-sparkles",
        });
        emit("close", { newTransaction: updateTransaction.transaction.value });
      } else if (status === "error") {
        // Pipe the error message to the ref controlling the alert
        submitErrorMessage.value =
          updateTransaction.errorMessage.value || "An unknown error occurred.";
      }

      // Disable the "Save" button while the request is in progress
      requestInProgress.value = status === "pending";
    },
    { immediate: true },
  );
}
</script>
