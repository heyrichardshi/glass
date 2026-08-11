# Setup

1. Create a `.env.api` file with the following contents:

```
COSMOS_DB_ENDPOINT=
COSMOS_DB_KEY=
COSMOS_DB_NAME=

PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=production

OIDC_ISSUER=https://idp.<tailnet>.ts.net
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_REDIRECT_URIS=https://<client-domain>/auth/callback
```

2. Create a `.deploy_sha` file in the same folder containing the commit SHA of a
   successful build, and nothing else:

```
28dff46bf7b1afd0ea32ef4930cbb49940c36178
```

3. Fetch the deploy script and run it:

```
curl -fsSL https://raw.githubusercontent.com/heyrichardshi/glass/refs/heads/main/deploy/deploy.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```
