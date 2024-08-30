export interface Transaction {
    transactionId: string,
    accountId: string,
    amount: string,
    date: Date,
    rawDescription: string,
    status: 'posted' | 'pending',
    tellerType?: string,
    tellerCategory?: string,
    tellerCounterparty?: string,
    categoryId: string,
    counterpartyId: string,
    tagIds: string[],
}
