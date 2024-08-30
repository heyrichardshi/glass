export interface Account {
    accountId: string,
    tellerAccessToken: string,
    name: string,
    institution: string,
    balance: string,
    mask: string,
    officialName: string,
    transactionsLastRefreshedAt: Date,
    type: string,
    status: string,
}
