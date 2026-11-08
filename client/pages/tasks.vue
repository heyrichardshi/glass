<template>
  <main class="mx-auto w-full max-w-5xl p-6">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Tasks</h1>
        <p class="mt-1 text-muted">
          Review transactions that need a category or merchant.
        </p>
      </div>
      <YearMonthSelector @selection="selectMonth" />
    </div>

    <UAlert
      v-if="loadErrorMessage"
      color="error"
      title="Unable to load tasks"
      :description="loadErrorMessage"
      class="mb-6"
    />

    <div v-else-if="loading" class="flex min-h-64 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin" />
    </div>

    <UCard v-else-if="tasks.length === 0">
      <div class="flex flex-col items-center gap-3 py-12 text-center">
        <UIcon name="i-lucide-circle-check-big" class="size-10 text-success" />
        <h2 class="text-xl font-semibold">All clear for this month</h2>
        <p class="max-w-md text-muted">
          Every transaction has a category and a merchant where one is expected.
        </p>
      </div>
    </UCard>

    <template v-else-if="currentTask">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-muted">
          Task {{ currentTaskIndex + 1 }} of {{ tasks.length }}
        </p>
        <div class="flex gap-2">
          <UButton
            label="Previous"
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            :disabled="currentTaskIndex === 0"
            @click="previousTask"
          />
          <UButton
            label="Next"
            trailing-icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            :disabled="currentTaskIndex >= tasks.length - 1"
            @click="nextTask"
          />
        </div>
      </div>

      <TaskReviewCard
        :key="`${currentTask.id}:${reviewRevision}`"
        :transaction="currentTask"
        :similar-transactions="similarTransactions"
        :accounts="accountsList.accounts.value"
        @saved="applySavedTransactions"
      />
    </template>
  </main>
</template>

<script setup lang="ts">
import type { BulkUpdateTransactionsResponse } from "@glass/types";
import { findSimilarTransactions } from "~/utils/transactionSimilarity";

const now = new Date();
const year = ref(now.getFullYear().toString());
const month = ref((now.getMonth() + 1).toString().padStart(2, "0"));

const monthlyTasks = useMonthlyTasks({ year, month });

const accountsList = useAccountsApi().listAccounts();
const categoriesList = useCategoriesApi().listCategories();
const merchantsList = useMerchantsApi().listMerchants();
const tagsList = useTagsApi().listTags();

const tasks = monthlyTasks.tasks;
const currentTaskIndex = ref(0);
const reviewRevision = ref(0);

const dependencyStatuses = [
  accountsList.status,
  categoriesList.status,
  merchantsList.status,
  tagsList.status,
];

const loading = computed(
  () =>
    monthlyTasks.status.value === "pending" ||
    monthlyTasks.status.value === "idle" ||
    monthlyTasks.annualTaskStatus.value === "pending" ||
    monthlyTasks.annualTaskStatus.value === "idle" ||
    dependencyStatuses.some(
      (status) => status.value === "pending" || status.value === "idle",
    ),
);

const loadErrorMessage = computed(() => {
  if (monthlyTasks.error.value) {
    return monthlyTasks.error.value.message;
  }
  if (monthlyTasks.annualTaskError.value) {
    return monthlyTasks.annualTaskError.value.message;
  }
  if (dependencyStatuses.some((status) => status.value === "error")) {
    return "The accounts or taxonomy needed to review transactions could not be loaded.";
  }
  return "";
});

const currentTask = computed(() => tasks.value[currentTaskIndex.value]);
const similarTransactions = computed(() =>
  currentTask.value
    ? findSimilarTransactions(
        currentTask.value,
        monthlyTasks.annualTaskCandidates.value,
      )
    : [],
);

watch(
  () => tasks.value.length,
  (taskCount) => {
    if (taskCount === 0) {
      currentTaskIndex.value = 0;
    } else if (currentTaskIndex.value >= taskCount) {
      currentTaskIndex.value = taskCount - 1;
    }
  },
  { immediate: true },
);

function selectMonth(selection: { year: string; month: string }) {
  year.value = selection.year;
  month.value = selection.month;
  currentTaskIndex.value = 0;
  reviewRevision.value++;
}

function previousTask() {
  if (currentTaskIndex.value > 0) {
    currentTaskIndex.value--;
    reviewRevision.value++;
  }
}

function nextTask() {
  if (currentTaskIndex.value < tasks.value.length - 1) {
    currentTaskIndex.value++;
    reviewRevision.value++;
  }
}

function applySavedTransactions(response: BulkUpdateTransactionsResponse) {
  const focusedTaskId = currentTask.value?.id;
  const previousTaskOrder = tasks.value.map(({ id }) => id);
  const previousIndex = currentTaskIndex.value;

  monthlyTasks.mergeUpdatedTransactions(response.updatedTransactions);

  const focusedTaskIndex = tasks.value.findIndex(
    ({ id }) => id === focusedTaskId,
  );
  if (focusedTaskIndex >= 0) {
    currentTaskIndex.value = focusedTaskIndex;
  } else {
    const nextTaskId = previousTaskOrder
      .slice(previousIndex + 1)
      .find((id) => tasks.value.some((task) => task.id === id));
    const previousTaskId = previousTaskOrder
      .slice(0, previousIndex)
      .reverse()
      .find((id) => tasks.value.some((task) => task.id === id));
    const replacementTaskId = nextTaskId ?? previousTaskId;

    currentTaskIndex.value = replacementTaskId
      ? tasks.value.findIndex(({ id }) => id === replacementTaskId)
      : 0;
  }

  reviewRevision.value++;
}
</script>
