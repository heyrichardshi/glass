<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-xl font-semibold">
              {{ transaction.description }}
            </h2>
            <UBadge
              v-if="isUncategorized(transaction)"
              label="Missing category"
              color="warning"
              variant="subtle"
            />
            <UBadge
              v-if="isMissingMerchant(transaction)"
              label="Missing merchant"
              color="warning"
              variant="subtle"
            />
          </div>
          <p class="mt-1 text-sm text-muted">
            {{ formatDisplayDate(transaction.date) }} · {{ accountName }}
          </p>
        </div>
        <p class="text-xl font-semibold tabular-nums">
          {{ formattedAmount(transaction.amount) }}
        </p>
      </div>
    </template>

    <div class="space-y-6">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-muted">
          Statement description
        </p>
        <p class="mt-1 break-words">{{ transaction.rawDescription }}</p>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <MerchantMenu
          allowCreate
          :disabled="transaction.counterparty.type === 'account'"
          :prefillWithMerchantId="initialMerchantId"
          @selectedMerchant="selectMerchant"
        />
        <CategoryMenu
          allowCreate
          :prefillWithCategoryId="transaction.categoryId"
          @selectedCategory="selectCategory"
        />
        <TagMenu
          class="md:col-span-2"
          :prefillWithTagIds="transaction.tagIds"
          @selectedTags="selectTags"
        />
      </div>

      <UAlert
        v-if="transaction.counterparty.type === 'account'"
        color="neutral"
        variant="subtle"
        title="This transaction points to another account, so its counterparty is preserved."
      />

      <section class="space-y-3 border-t border-default pt-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="font-semibold">Similar transactions</h3>
            <p class="text-sm text-muted">
              Apply the changed fields to matching tasks from the last 12
              months.
            </p>
          </div>
          <div v-if="similarTransactions.length > 0" class="flex gap-2">
            <UButton
              label="Select all"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="selectAllSimilar"
            />
            <UButton
              label="Clear all"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="clearSimilar"
            />
          </div>
        </div>

        <p v-if="similarTransactions.length === 0" class="text-sm text-muted">
          No other tasks from the last 12 months share a description token.
        </p>

        <div
          v-else
          class="divide-y divide-default rounded-lg border border-default"
        >
          <label
            v-for="similar in similarTransactions"
            :key="similar.id"
            class="flex cursor-pointer items-start gap-3 p-3"
          >
            <UCheckbox
              :model-value="selectedSimilarIds.has(similar.id)"
              :aria-label="`Select ${similar.description}`"
              class="mt-1"
              @update:model-value="toggleSimilar(similar.id, $event)"
            />
            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-medium">{{ similar.description }}</span>
                <span class="text-sm tabular-nums">
                  {{ formattedAmount(similar.amount) }}
                </span>
              </span>
              <span class="mt-1 block text-sm text-muted">
                {{ formatDisplayDate(similar.date) }} ·
                {{ accountNameFor(similar.accountId) }}
              </span>
              <span class="mt-1 flex flex-wrap gap-1">
                <UBadge
                  v-if="isUncategorized(similar)"
                  label="Missing category"
                  color="warning"
                  variant="subtle"
                  size="sm"
                />
                <UBadge
                  v-if="isMissingMerchant(similar)"
                  label="Missing merchant"
                  color="warning"
                  variant="subtle"
                  size="sm"
                />
              </span>
            </span>
          </label>
        </div>

        <UAlert
          v-if="submitErrorMessage"
          color="error"
          :title="submitErrorMessage"
        />
      </section>
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-muted">
          Saving updates this task and
          {{ selectedSimilarIds.size }}
          selected similar
          {{ selectedSimilarIds.size === 1 ? "transaction" : "transactions" }}.
        </p>
        <UButton
          label="Save changes"
          icon="i-lucide-check"
          :disabled="!changesMade"
          :loading="requestInProgress"
          @click="commitChanges"
        />
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import type {
  Account,
  BulkUpdateTransactionsRequest,
  Category,
  Merchant,
  Tag,
  Transaction,
} from "@glass/types";
import { isMissingMerchant, isUncategorized } from "~/utils/transactionTasks";

const props = defineProps<{
  transaction: Transaction;
  similarTransactions: Transaction[];
  accounts: Account[];
}>();

const emit = defineEmits<{
  saved: [
    {
      updatedTransactions: Transaction[];
      failedUpdates: { transactionId: string; error: string }[];
    },
  ];
}>();

const initialMerchantId =
  props.transaction.counterparty.type === "merchant" &&
  !isMissingMerchant(props.transaction)
    ? props.transaction.counterparty.id
    : undefined;

const selectedMerchant = ref<Merchant | undefined>();
const selectedCategory = ref<Category | undefined>();
const selectedTags = ref<Tag[]>([]);
const selectedSimilarIds = ref(new Set<string>());

function selectMerchant(merchant: Merchant | undefined) {
  selectedMerchant.value = merchant;
}

function selectCategory(category: Category | undefined) {
  selectedCategory.value = category;
}

function selectTags(tags: Tag[]) {
  selectedTags.value = tags;
}

const merchantChanged = computed(
  () =>
    selectedMerchant.value !== undefined &&
    (props.transaction.counterparty.type !== "merchant" ||
      selectedMerchant.value.id !== props.transaction.counterparty.id),
);

const categoryChanged = computed(
  () =>
    selectedCategory.value !== undefined &&
    selectedCategory.value.id !== props.transaction.categoryId,
);

const tagsChanged = computed(() => {
  const selectedIds = selectedTags.value.map(({ id }) => id).sort();
  const originalIds = [...props.transaction.tagIds].sort();
  return (
    selectedIds.length !== originalIds.length ||
    selectedIds.some((id, index) => id !== originalIds[index])
  );
});

const changesMade = computed(
  () => merchantChanged.value || categoryChanged.value || tagsChanged.value,
);

const accountName = computed(() => accountNameFor(props.transaction.accountId));

function accountNameFor(accountId: string): string {
  return (
    props.accounts.find((account) => account.id === accountId)?.name ??
    "Unknown account"
  );
}

function formattedAmount(amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return `$${amount}`;
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: props.transaction.currency,
  });
}

function toggleSimilar(
  transactionId: string,
  selected: boolean | "indeterminate",
) {
  const next = new Set(selectedSimilarIds.value);
  if (selected === true) {
    next.add(transactionId);
  } else {
    next.delete(transactionId);
  }
  selectedSimilarIds.value = next;
}

function selectAllSimilar() {
  selectedSimilarIds.value = new Set(
    props.similarTransactions.map(({ id }) => id),
  );
}

function clearSimilar() {
  selectedSimilarIds.value = new Set();
}

const transactionsApi = useTransactionsApi();
const toast = useToast();
const requestInProgress = ref(false);
const submitErrorMessage = ref("");

function commitChanges() {
  if (!changesMade.value || requestInProgress.value) {
    return;
  }

  const updates: BulkUpdateTransactionsRequest["updates"] = {};

  if (merchantChanged.value && selectedMerchant.value) {
    updates.counterparty = {
      id: selectedMerchant.value.id,
      type: "merchant",
    };
  }
  if (categoryChanged.value && selectedCategory.value) {
    updates.categoryId = selectedCategory.value.id;
  }
  if (tagsChanged.value) {
    updates.tagIds = selectedTags.value.map(({ id }) => id);
  }

  const bulkUpdate = transactionsApi.bulkUpdateTransactions({
    transactionIds: [
      props.transaction.id,
      ...Array.from(selectedSimilarIds.value),
    ],
    updates,
  });

  watch(
    bulkUpdate.status,
    (status) => {
      requestInProgress.value = status === "pending";

      if (status === "success" && bulkUpdate.response.value) {
        const response = bulkUpdate.response.value;
        const failedCount = response.failedUpdates.length;
        toast.add({
          title:
            failedCount === 0
              ? `Updated ${response.updatedTransactions.length} transaction${response.updatedTransactions.length === 1 ? "" : "s"}`
              : `Updated ${response.updatedTransactions.length}; ${failedCount} failed`,
          color: failedCount === 0 ? "success" : "warning",
          icon:
            failedCount === 0
              ? "i-lucide-circle-check"
              : "i-lucide-triangle-alert",
        });
        emit("saved", response);
      } else if (status === "error") {
        submitErrorMessage.value =
          bulkUpdate.errorMessage.value || "Unable to update transactions.";
      }
    },
    { immediate: true },
  );
}
</script>
