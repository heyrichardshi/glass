<template>
  <UButton v-if="isTellerLoaded" @click="openTellerConnect()">
    Connect an account
  </UButton>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const tellerApplicationId = config.public.TELLER_APPLICATION_ID;

const isTellerLoaded = ref(false);
const tellerConnect = ref<any>(null);

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
    // Part 3. Handle a successful enrollment's accessToken
    onSuccess: function (enrollment: TellerConnectEnrollment) {
      console.log("User enrolled successfully: ", enrollment);
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
</script>
