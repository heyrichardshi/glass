import { Container, StatusCodes } from "@azure/cosmos";
import { DatabaseProvider } from "./database";
import { User, UserIdentity } from "../models";
import { DatabaseError } from "../common/errors";

const USER_CONTAINER_ID = "users";

/* How many times an append re-reads and retries after losing to a concurrent write. */
const MAX_APPEND_ATTEMPTS = 3;

export class UserRepository {
  private static instance: UserRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
      id: USER_CONTAINER_ID,
      partitionKey: {
        paths: ["/id"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        // For identity resolution.
        // Indexing the subject such that the issuer can be checked against the returned documents.
        includedPaths: [{ path: "/identities/[]/subject/?" }],
        excludedPaths: [
          { path: "/*" }, // Exclude everything by default to only index explicitly included properties
        ],
        compositeIndexes: [],
      },
    });
  }

  public static async getInstance(): Promise<UserRepository> {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

  /**
   * Finds the user holding this {issuer, subject} pair, or `undefined` if no one does.
   */
  async findByIdentity(identity: UserIdentity): Promise<User | undefined> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<User>({
        query:
          "SELECT VALUE c FROM c JOIN i IN c.identities " +
          "WHERE i.subject = @subject AND i.issuer = @issuer",
        parameters: [
          { name: "@subject", value: identity.subject },
          { name: "@issuer", value: identity.issuer },
        ],
      })
      .fetchAll();

    return response.resources[0];
  }

  async create(user: User): Promise<User> {
    const container = await this.promisedContainer;

    const response = await container.items.create(user);

    if (response.statusCode !== StatusCodes.Created) {
      throw new DatabaseError(
        `Failed to create user, status ${response.statusCode}.`,
      );
    }

    return response.resource as unknown as User;
  }

  async list(): Promise<User[]> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<User>("SELECT * FROM c")
      .fetchAll();

    return response.resources;
  }

  /**
   * Adds an identity to an existing user, and returns the updated document.
   * This operation is idempotent.
   *
   * Read-modify-write guarded by the ETag from the read, so two identities being attached at once
   * cannot silently discard one: the loser sees a 412, re-reads and reapplies its own change.
   */
  async appendIdentity(
    userId: string,
    identity: UserIdentity,
  ): Promise<User | undefined> {
    const container = await this.promisedContainer;
    const item = container.item(userId, userId);

    for (let attempt = 1; attempt <= MAX_APPEND_ATTEMPTS; attempt++) {
      let existing;
      try {
        existing = (await item.read<User>()).resource;
      } catch (err: any) {
        if (err.code === StatusCodes.NotFound) {
          return undefined;
        }
        throw err;
      }

      if (!existing) {
        return undefined;
      }

      const alreadyPresent = existing.identities.some(
        (candidate) =>
          candidate.issuer === identity.issuer &&
          candidate.subject === identity.subject,
      );
      if (alreadyPresent) {
        return existing;
      }

      const updated: User = {
        ...existing,
        identities: [...existing.identities, identity],
      };

      try {
        const response = await item.replace(updated, {
          accessCondition: { type: "IfMatch", condition: existing._etag },
        });
        return response.resource as unknown as User;
      } catch (err: any) {
        if (err.code !== StatusCodes.PreconditionFailed) {
          throw err;
        }
        console.warn(
          `Identity append for user ${userId} lost to a concurrent write; ` +
            `retrying (attempt ${attempt} of ${MAX_APPEND_ATTEMPTS}).`,
        );
      }
    }

    throw new DatabaseError(
      `Failed to append an identity to user ${userId} after ${MAX_APPEND_ATTEMPTS} attempts.`,
    );
  }
}
