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
OIDC_AUDIENCE=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_REDIRECT_URIS=https://<client-domain>/auth/callback

LOG_LEVEL=info
CLIENT_ORIGIN=https://<client-domain>
```

`OIDC_AUDIENCE` is the audience `requireToken` enforces on every verified token.
It is the client ID tsidp issued, so it holds the same value as
`OIDC_CLIENT_ID`.

`LOG_LEVEL` is the pino level. `info` is the default; `warn` silences
per-account chatter.

`CLIENT_ORIGIN` is the public client origin CORS will accept. Exactly one
value, with scheme, and no trailing slash. A missing or wildcard value
refuses to start.

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
