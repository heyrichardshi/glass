import useListAccounts from "./api/accounts/useListAccounts";

export default function () {
  const listAccounts = (userId: string) => useListAccounts(userId);

  return { listAccounts };
}
