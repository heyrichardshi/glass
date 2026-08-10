# Glass / Server

## Development

It is recommended to install [`httpie`](https://github.com/httpie/cli) for simpler testing of API endpoints.

```
brew install httpie
```

Create a `.env` file in `server` root with following keys:
```
PORT=7070

PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV="sandbox" # or "production"

COSMOS_DB_ENDPOINT="https://localhost:8081/"
COSMOS_DB_KEY=
COSMOS_DB_NAME=
```

Start the server locally:
```
pnpm dev

# or

pnpm docker:build
pnpm docker:run
```

## References
- [`@azure/cosmos` SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/cosmos/?view=azure-node-latest)
- [Zod Documentation](https://zod.dev/)
