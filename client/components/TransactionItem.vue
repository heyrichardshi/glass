<template>
  <USlideover title="Edit Transaction" :description="editPanelDescription">
    <div
      class="w-full rounded-xl bg-gray-100 p-4 flex items-center justify-between shadow-sm mb-2"
    >
      <div class="text-sm text-gray-600">{{ transactionDateField }}</div>
      <div
        class="text-base font-medium text-gray-800 truncate mx-4 flex-1 text-center"
      >
        {{ transaction.description }}
      </div>
      <div class="text-sm font-semibold text-right text-gray-900">
        {{ formattedAmount }}
      </div>
    </div>

    <template #body>
      <div class="grid grid-cols-2 gap-4">
        <!-- Date -->
        <UFormField label="Date">
          <UPopover>
            <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
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
        <UFormField label="Category">
          <UInputMenu
            v-model="editCategory"
            :items="allCategories"
            class="w-full"
          />
        </UFormField>

        <!-- Tags -->
        <UFormField label="Tags">
          <UInputMenu
            v-model="editTags"
            multiple
            :items="allTags"
            class="w-full"
          />
        </UFormField>

        <!-- Notes (full width)-->
        <UFormField
          label="Notes"
          description="Add any extra information here; will not show up in searches."
          class="col-span-full"
        >
          <UTextarea v-model="editNotes" autoresize class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton label="Clear" color="neutral" />
      <UButton label="Save" />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Transaction } from "@saffron/types";

import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";

const props = defineProps<{
  transaction: Transaction;
}>();

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

// TODO: Create composables for categories and tags for shared state across all transactions and global updates.
const allCategories = ref(["Test 1", "Test 2", "Test 3"]);

const allTags = ref(["Tag 1", "Tag 2", "Tag 3"]);

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

const editCategory = ref("Placeholder Category");

const editTags = ref(["test"]);

const editNotes = ref(props.transaction.notes);
</script>
