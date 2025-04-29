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
      </div>
    </template>

    <template #footer>
      <UButton label="Clear" color="neutral" />
      <UButton label="Save" @click="commitChanges()" />
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
import CategoryMenu from "./CategoryMenu.vue";
import TagMenu from "./TagMenu.vue";

const props = defineProps<{
  transaction: Transaction;
}>();

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

function commitChanges() {
  console.log("Save clicked");
  console.log("editCategory: ", editCategory.value);
}
</script>
