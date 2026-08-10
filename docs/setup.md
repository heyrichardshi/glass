# Setup

1. Create a `.env.api` file with the following contents:

```
COSMOS_DB_ENDPOINT=
COSMOS_DB_KEY=
COSMOS_DB_NAME=

PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=production
```
   This file should be placed alongside the compose file.

2. Create a `.deploy_sha` file in the same folder containing the commit SHA of a
   successful build, and nothing else:

```
28dff46bf7b1afd0ea32ef4930cbb49940c36178
```

   It is a plain pointer rather than an env file, so it is read by exporting it
   rather than by Compose:

```
export GLASS_SHA=$(cat .deploy_sha)
```
