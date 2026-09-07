<template>
  <div class="w-full flex justify-center gap-2">
    <YearMonthSelector @selection="selectedYearMonth" />
    <UButton
      label="Generate Report"
      :loading="requestInProgress"
      @click="generateReport"
    />
  </div>

  <UAlert
    color="error"
    :title="submitErrorMessage"
    v-if="submitError"
    class="w-full"
  />

  <div class="w-full grid grid-cols-2" v-if="loadedMonthlyReport">
    <div class="w-full">
      <h1>Total Income</h1>
      <p class="text-2xl font-bold">
        {{ monthlyReport?.totalIncome }}
      </p>
    </div>
    <div class="w-full">
      <h1>Total Expenses</h1>
      <p class="text-2xl font-bold">
        {{ monthlyReport?.totalExpense }}
      </p>
    </div>
    <div class="w-full">
      <h1>Expenses by Category</h1>
      <AnalyticsCategoryBreakdown
        :categoryTransactions="monthlyReport!!.categoryExpenses"
        :transactions="monthlyReport!!.transactions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GetMonthlyReportResponse } from "@glass/types";

const toast = useToast();

const reportsApi = useReportsApi();

const requestInProgress = ref(false);
const submitErrorMessage = ref("");
const submitError = computed(() => !!submitErrorMessage.value);

const monthlyReport = ref<GetMonthlyReportResponse | undefined>(undefined);
const loadedMonthlyReport = computed(() => !!monthlyReport.value);

const year = ref<string>("");
const month = ref<string>("");
function selectedYearMonth(d: { year: string; month: string }) {
  year.value = d.year;
  month.value = d.month;
}

function generateReport() {
  console.log("Generating report...");

  const monthlyReportRes = reportsApi.getMonthlyReport({
    year: year.value,
    month: month.value,
  });

  watch(
    monthlyReportRes.status,
    (status) => {
      if (status === "success") {
        toast.add({
          title: `Generated report!`,
          color: "success",
          icon: "i-lucide-sparkles",
        });
        console.log(monthlyReportRes.response.value);
        monthlyReport.value = monthlyReportRes.response.value;
      } else if (status === "error") {
        // Pipe the error message to the ref controlling the alert
        submitErrorMessage.value =
          monthlyReportRes.errorMessage.value || "An unknown error occurred.";
      }

      // Disable the "Create" button while the request is in progress
      requestInProgress.value = status === "pending";
    },
    { immediate: true },
  );
}
</script>
