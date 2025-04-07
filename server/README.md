# Saffron / Server

## Development

It is recommended to install [`httpie`](https://github.com/httpie/cli) for simpler testing of API endpoints.

```
brew install httpie
```

Create a `.env` file in `server` root with following keys:
```
PORT=7070
TELLER_APPLICATION_ID=
TELLER_CERTIFICATE_PATH=
TELLER_KEY_PATH=

COSMOS_DB_ENDPOINT="https://localhost:8081/"
COSMOS_DB_KEY=
COSMOS_DB_NAME=
```

Start the server locally:
```
pnpm docker:build
pnpm docker:run
```
