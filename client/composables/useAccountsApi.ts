import useListAccounts from "./api/accounts/useListAccounts";

export default function () {
  const listAccounts = () => useListAccounts();

  return { listAccounts };
}
