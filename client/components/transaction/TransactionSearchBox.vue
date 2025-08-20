<template>
  <UButtonGroup class="w-full">
    <UInput
      v-model="searchText"
      placeholder="Search transactions"
      size="xl"
      class="w-full"
      :ui="{
        base:
          'transition-all duration-200 ease-out ' +
          (selectedFilters.length > 0 ? 'pb-8' : ''),
        trailing: selectedFilters.length > 0 ? 'mt-8' : '',
      }"
    >
      <template v-if="selectedFilters.length > 0" #trailing>
        <BadgeWithIcon
          v-for="filter in selectedFilters"
          :key="filter.value"
          :icon="filter.icon"
          :label="filter.label"
        />
      </template>
    </UInput>

    <UPopover :content="{ side: 'bottom', align: 'end' }">
      <UButton
        icon="i-lucide-list-filter"
        variant="subtle"
        color="neutral"
        class="px-4"
      />

      <template #content>
        <UCommandPalette
          multiple
          placeholder="Search filters..."
          v-model="selectedFilters"
          :groups="filterGroups"
          :ui="{ input: '[&>input]:h-8 [&>input]:text-sm' }"
        />
      </template>
    </UPopover>

    <UButton icon="i-lucide-search" @click="search()" class="px-4" />
  </UButtonGroup>
</template>

<script setup lang="ts">
type FilterItem = {
  label: string;
  value: string;
  type: "account" | "merchant" | "category" | "tag";
  icon: string;
};

const searchText = ref("");

const accountsApi = useAccountsApi();
const merchantsApi = useMerchantsApi();
const categoriesApi = useCategoriesApi();
const tagsApi = useTagsApi();

const userId = "0";

const listAccounts = accountsApi.listAccounts(userId);
const accounts = computed(() => listAccounts.accounts.value);
const accountItems = computed<FilterItem[]>(() =>
  accounts.value.map((account) => ({
    label: account.name,
    value: account.id,
    type: "account",
    icon: "i-lucide-credit-card",
  })),
);

const listMerchants = merchantsApi.listMerchants({ householdId: userId });
const merchants = computed(() => listMerchants.merchants.value);
const merchantItems = computed<FilterItem[]>(() =>
  merchants.value.map((merchant) => ({
    label: merchant.name,
    value: merchant.id,
    type: "merchant",
    icon: "i-lucide-store",
  })),
);

const listCategories = categoriesApi.listCategories(userId);
const categories = computed(() => listCategories.categories.value);
const categoryItems = computed<FilterItem[]>(() =>
  categories.value.map((category) => ({
    label: category.name,
    value: category.id,
    type: "category",
    icon: "i-lucide-chart-pie",
  })),
);

const listTags = tagsApi.listTags(userId);
const tags = computed(() => listTags.tags.value);
const tagItems = computed<FilterItem[]>(() =>
  tags.value.map((tag) => ({
    label: tag.name,
    value: tag.id,
    type: "tag",
    icon: "i-lucide-tag",
  })),
);

function search() {
  console.log("search: " + searchText.value);
}

const filterGroups = computed(() => [
  { id: "accounts", label: "Accounts", items: accountItems.value },
  { id: "merchants", label: "Merchants", items: merchantItems.value },
  { id: "categories", label: "Categories", items: categoryItems.value },
  { id: "tags", label: "Tags", items: tagItems.value },
]);
const selectedFilters = ref<Array<FilterItem>>([]);

const searchFilters = computed(() => {
  return {
    searchText: searchText.value,
    accountIds: selectedFilters.value
      .filter((filter) => filter.type === "account")
      .map((filter) => filter.value),
    merchantIds: selectedFilters.value
      .filter((filter) => filter.type === "merchant")
      .map((filter) => filter.value),
    categoryIds: selectedFilters.value
      .filter((filter) => filter.type === "category")
      .map((filter) => filter.value),
    tagIds: selectedFilters.value
      .filter((filter) => filter.type === "tag")
      .map((filter) => filter.value),
  };
});
</script>
