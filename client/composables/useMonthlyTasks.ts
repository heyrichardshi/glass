import type { ListTransactionsResponse, Transaction } from "@glass/types";
import type { TransactionSearchFilters } from "@glass/types/schemas";
import { getTaskDateRanges, needsAttention } from "~/utils/transactionTasks";

export default function (params: { year: Ref<string>; month: Ref<string> }) {
  const { apiBase } = useApiBase();

  const selectedMonth = computed(() =>
    getTaskDateRanges(params.year.value, params.month.value),
  );

  async function fetchAllTransactions(
    filters: TransactionSearchFilters,
  ): Promise<Transaction[]> {
    const matchingTransactions: Transaction[] = [];
    const seenTokens = new Set<string>();
    let paginationToken: string | undefined;

    do {
      const response = await $fetch<ListTransactionsResponse>(
        `${apiBase.value}/transactions/search`,
        {
          method: "POST",
          body: {
            filters,
            ...(paginationToken ? { paginationToken } : {}),
          },
        },
      );

      matchingTransactions.push(...response.transactions);
      paginationToken = response.paginationToken;

      if (paginationToken) {
        if (seenTokens.has(paginationToken)) {
          throw new Error(
            "Transaction search returned a repeated pagination token.",
          );
        }
        seenTokens.add(paginationToken);
      }
    } while (paginationToken);

    return matchingTransactions;
  }

  const monthlyKey = computed(
    () => `MonthlyTasks:${params.year.value}:${params.month.value}`,
  );

  const {
    data: transactions,
    status,
    error,
    refresh,
  } = useAsyncData<Transaction[]>(
    monthlyKey,
    async () => {
      if (!selectedMonth.value) {
        return [];
      }

      return fetchAllTransactions(selectedMonth.value.monthRange);
    },
    { default: () => [] },
  );

  const annualKey = computed(
    () => `AnnualTaskCandidates:${params.year.value}:${params.month.value}`,
  );

  const {
    data: annualTaskCandidates,
    status: annualTaskStatus,
    error: annualTaskError,
    refresh: refreshAnnualTasks,
  } = useAsyncData<Transaction[]>(
    annualKey,
    async () => {
      if (!selectedMonth.value) {
        return [];
      }

      const annualRange = selectedMonth.value.annualRange;
      const [uncategorized, missingMerchant] = await Promise.all([
        fetchAllTransactions({
          ...annualRange,
          categoryIds: ["0"],
        }),
        fetchAllTransactions({
          ...annualRange,
          merchantIds: ["0"],
        }),
      ]);

      return Array.from(
        new Map(
          [...uncategorized, ...missingMerchant].map((transaction) => [
            transaction.id,
            transaction,
          ]),
        ).values(),
      )
        .filter(needsAttention)
        .sort(
          (left, right) =>
            right.date.localeCompare(left.date) ||
            left.id.localeCompare(right.id),
        );
    },
    { default: () => [] },
  );

  const tasks = computed(() => transactions.value.filter(needsAttention));

  function mergeUpdatedTransactions(updatedTransactions: Transaction[]) {
    const updatedById = new Map(
      updatedTransactions.map((transaction) => [transaction.id, transaction]),
    );

    transactions.value = transactions.value.map(
      (transaction) => updatedById.get(transaction.id) ?? transaction,
    );
    annualTaskCandidates.value = annualTaskCandidates.value
      .map((transaction) => updatedById.get(transaction.id) ?? transaction)
      .filter(needsAttention);
  }

  return {
    transactions,
    tasks,
    status,
    error,
    refresh,
    annualTaskCandidates,
    annualTaskStatus,
    annualTaskError,
    refreshAnnualTasks,
    mergeUpdatedTransactions,
  };
}
