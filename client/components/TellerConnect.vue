<template>
  <UButton v-if="isTellerLoaded" @click="openTellerConnect()">
    Connect an account
  </UButton>
</template>

<script setup lang="ts">
import type { RegisterAccountsResponse } from "@saffron/types";

const config = useRuntimeConfig();
const tellerApplicationId = config.public.TELLER_APPLICATION_ID;

const isTellerLoaded = ref(false);
const tellerConnect = ref<any>(null);

const toast = useToast();

interface TellerConnectEnrollment {
  accessToken: string;
  user: { id: string };
  enrollment: { id: string; institution: { id: string; name: string } };
  signatures?: string[];
}

onMounted(() => {
  tellerConnect.value = TellerConnect.setup({
    applicationId: tellerApplicationId,
    environment: "development",
    products: ["verify", "balance", "transactions"],
    selectAccount: "multiple",
    onInit: function () {
      console.log("Teller Connect has initialized");
    },
    onSuccess: function (enrollment: TellerConnectEnrollment) {
      console.log("User enrolled successfully: ", enrollment);
      registerAccounts(enrollment.accessToken);

      // TODO: Refresh account list on success, maybe via exposed ref or callback
    },
    onExit: function () {
      console.log("User closed Teller Connect");
    },
    onFailure: function (failure: {
      type: string;
      code: string;
      message: string;
    }) {
      console.error("Teller Connect failed: ", failure);
    },
  });

  isTellerLoaded.value = true;
});

function openTellerConnect() {
  tellerConnect.value.open();
}

function registerAccounts(accessToken: string) {
  useFetch(() => `${config.public.SAFFRON_API_URL}/accounts/register`, {
    query: { accessToken },
    method: "POST",
    server: false,
    onResponse({ response }) {
      const res = response._data as RegisterAccountsResponse;
      toast.add({
        title: `Successfully added ${res.accountsRegisteredCount} accounts`,
        color: "success",
      });
    },
    onRequestError({ error: err }) {
      toast.add({
        title: "Something went wrong",
        description: `Error adding accounts: ${err.message}`,
        color: "error",
      });
    },
  });
}
</script>
