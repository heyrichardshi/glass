<template>
  <USlideover
    title="Edit Transaction"
    :description="editPanelDescription"
    :close="{ onClick: () => close() }"
  >
    <template #body>
      <div class="grid grid-cols-2 gap-4">
        <!-- Date -->
        <UFormField label="Date">
          <UPopover>
            <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
              <!-- TODO: Fix same timezone bug where depending on time of day the displayed date is 1 day before the actual date -->
              {{
                editTransactionDate
                  ? df.format(editTransactionDate.toDate(getLocalTimeZone()))
                  : "Select a date"
              }}
            </UButton>

            <template #content>
              <UCalendar v-model="editTransactionDate" class="p-2" />
            </template>
          </UPopover>
        </UFormField>

        <!-- Merchant / Counterparty -->
        <UFormField label="Merchant">
          <UInput v-model="editMerchant" disabled />
        </UFormField>

        <!-- Description (full width)-->
        <UFormField label="Description" class="col-span-full">
          <UInput v-model="editDescription" class="w-full" />
        </UFormField>

        <!-- Category -->
        <CategoryMenu allowCreate @selectedCategory="selectedCategory" />

        <!-- Tags -->
        <TagMenu :prefillWithTagIds="loadTags()" @selectedTags="selectedTags" />
        <!-- <UFormField label="Tags">
          <UInputMenu
            v-model="editTags"
            multiple
            :items="allTags"
            class="w-full"
          />
        </UFormField> -->

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
import type { Category, Tag, Transaction } from "@saffron/types";

import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";
import CategoryMenu from "../CategoryMenu.vue";
import TagMenu from "../TagMenu.vue";
import useTransactionsApi from "~/composables/useTransactionsApi";

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

const date = computed(() => new Date(props.transaction.date));
const formattedDate = computed(() =>
  date.value.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }),
);

const transactionDateField = computed(() => {
  return props.transaction.status == "pending"
    ? "Pending"
    : formattedDate.value;
});

const formattedAmount = computed(() => `$${props.transaction.amount}`);

const editPanelDescription = computed(() => {
  const prefix = props.transaction.status === "pending" ? "Pending " : "";
  return `${prefix}${formattedAmount.value} for ${props.transaction.description} on ${formattedDate.value}`;
});

function loadTags(): string[] {
  return props.transaction.tagIds;
}

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const editTransactionDate = shallowRef(
  new CalendarDate(
    date.value.getFullYear(),
    date.value.getMonth(),
    date.value.getDate(),
  ),
);

const editMerchant = ref("");

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
  console.log("editTransactionDate: ", editTransactionDate.value);
  console.log("editDescription: ", editDescription.value);
  console.log("editNotes: ", editNotes.value);

  const updateTransaction = transactionsApi.updateTransaction({
    userId,
    transactionId: props.transaction.id,
    date: editTransactionDate.value.toString(),
    description: editDescription.value,
    categoryId: editCategory.value?.id,
    tagIds: editTags.value.map((tag) => tag.id),
    notes: editNotes.value,
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
