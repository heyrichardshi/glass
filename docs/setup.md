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

2. Create a `.deploy_sha` file in the same folder containing the commit SHA of a
   successful build, and nothing else:

```
28dff46bf7b1afd0ea32ef4930cbb49940c36178
```

3. Run the following to fetch the latest compose file and deploy it:

```
SHA=$(cat .deploy_sha)
curl -fsSL "https://raw.githubusercontent.com/heyrichardshi/glass/$SHA/docker-compose.prod.yml" -o docker-compose.yml
chmod 600 .env.api
export GLASS_SHA="$SHA"
docker compose config --quiet
docker compose up -d
```
