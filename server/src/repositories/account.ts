import { Container, StatusCodes } from '@azure/cosmos';
import { Account } from '../models';
import { DatabaseProvider } from './database';

const ACCOUNT_CONTAINER_ID = "accounts";

export class AccountRepository {
  private static instance: AccountRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getInstance()
        .then((provider) => provider.getDatabase())
        .then((db) =>
            db.containers.createIfNotExists({
                id: ACCOUNT_CONTAINER_ID,
                partitionKey: {
                    paths: [
                        '/id',
                    ],
                },
            })
        )
        .then((res) => res.container);
  }

  public static async getInstance(): Promise<AccountRepository> {
    if (!AccountRepository.instance) {
      AccountRepository.instance = new AccountRepository();
    }
    return AccountRepository.instance;
  }

  async create(account: Account): Promise<number> {
    const container = await this.promisedContainer;

    const response = await container.items.create(account);
    console.log('Created account in db: ', response);

    return response.statusCode;
  }

    // Find an account by ID
    async findById(accountId: string): Promise<Account | undefined> {
      const container = await this.promisedContainer;

      const response = await container.items
        .query<Account>({ query: 'SELECT * FROM c WHERE c.id = @accountId', parameters: [{ name: '@accountId', value: accountId }] })
        .fetchAll();
      console.log('Fetching account ', accountId, ' from db: ', response);

      return response.resources[0];
    }
}
