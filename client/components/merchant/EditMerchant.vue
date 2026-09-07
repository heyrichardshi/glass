<template>
  <USlideover title="Edit Merchant" :close="{ onClick: () => close() }">
    <template #body>
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Name">
          <UInput v-model="name" class="w-full" />
        </UFormField>

        <CategoryMenu
          allowCreate
          :prefillWithCategoryId="merchant.defaultCategoryId"
          @selectedCategory="selectCategory"
        />

        <UFormField label="Matchers" class="col-span-full">
          <UButtonGroup class="w-full">
            <!-- Input with embedded search button -->
            <UInput v-model="newMatcher" class="w-full">
              <template v-if="hasMatcherInput" #trailing>
                <UTooltip
                  text="Search for transaction with this matcher"
                  :content="{ side: 'right' }"
                >
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-search"
                    @click="searchTransactions()"
                  />
                </UTooltip>
              </template>
            </UInput>

            <!-- Attached "add" button -->
            <UTooltip text="Add matcher">
              <UButton
                color="primary"
                variant="subtle"
                icon="i-lucide-plus"
                size="lg"
                class="px-4"
                :disabled="!hasMatcherInput"
                @click="addMatcher()"
              />
            </UTooltip>
          </UButtonGroup>
          <p class="text-xs italic text-gray-500 mt-1">
            Current matchers:
            <br />
            {{ matchers }}
          </p>
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
      <UButton
        label="Save"
        :loading="requestInProgress"
        @click="commitChanges()"
      />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Category, Merchant } from "@glass/types";

const props = defineProps<{
  merchant: Merchant;
}>();

const emit = defineEmits<{
  close: [{ newMerchant?: Merchant }];
}>();

function close() {
  emit("close", {});
}

const name = ref(props.merchant.name);

const selectedCategory = ref<Category | undefined>();
function selectCategory(category: Category | undefined) {
  selectedCategory.value = category;
}

const newMatcher = ref("");
const matchers = ref(props.merchant.descriptionMatchers);

function searchTransactions() {
  const text = newMatcher.value.trim();
  if (!text) {
    return;
  }

  const overlay = useOverlay();
  const preview = overlay.create(
    // Lazy import to avoid circular refs
    defineAsyncComponent(
      () => import("../transaction/TransactionSearchPreviewModal.vue"),
    ),
    {
      props: {
        filters: {
          searchText: text,
        },
      },
    },
  );

  preview.open();
}

function addMatcher() {
  const text = newMatcher.value.trim();
  if (!text) {
    return;
  }

  matchers.value.push(text);
  newMatcher.value = "";
}

const merchantsApi = useMerchantsApi();
const toast = useToast();

const requestInProgress = ref(false);
const submitErrorMessage = ref("");
const submitError = computed(() => !!submitErrorMessage.value);

const hasMatcherInput = computed(() => newMatcher.value.trim().length > 0);

function commitChanges() {
  console.log("Save clicked");
  console.log("name: ", name.value);
  console.log("selectedCategory: ", selectedCategory.value);
  console.log("matchers: ", matchers.value);

  const request = {
    name: name.value,
    defaultCategoryId: selectedCategory.value?.id,
    descriptionMatchers: matchers.value,
  };

  const result = merchantsApi.updateMerchant(props.merchant.id, request);

  watch(
    result.status,
    (status) => {
      if (status === "success") {
        toast.add({
          title: `Updated merchant ${name.value}`,
          color: "success",
          icon: "i-lucide-sparkles",
        });
        emit("close", { newMerchant: result.merchant.value });
      } else if (status === "error") {
        // Pipe the error message to the ref controlling the alert
        submitErrorMessage.value =
          result.errorMessage.value || "An unknown error occurred.";
      }

      // Disable the "Save" button while the request is in progress
      requestInProgress.value = status === "pending";
    },
    { immediate: true },
  );
}
</script>
