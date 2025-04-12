// https://teller.io/docs/api/accounts
export interface Account {
  type: string;
  status: string;
  name: string;
  last_four: string;
  institution: {
    name: string;
    id: string;
  };
  id: string;
}

// https://teller.io/docs/api/account/balances
export interface AccountBalance {
  account_id: string;
  ledger?: string;
  available?: string;
}

// https://teller.io/docs/api/account/transactions
export interface Transaction {
  type: string;
  status: string;
  id: string;
  details: {
    processing_status: string;
    counterparty?: {
      name: string;
      type: string;
    };
    category?: string;
  };
  description: string;
  date: string;
  amount: string;
  account_id: string;
}
