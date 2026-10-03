#!/usr/bin/env bash
#
# Pins a commit and brings the stack up on it.
#
#   ./deploy.sh <sha>   pin to that commit, then deploy
#   ./deploy.sh         redeploy whatever .deploy_sha already names

set -euo pipefail

REPO="heyrichardshi/glass"

if [ $# -gt 0 ]; then
  echo "$1" > .deploy_sha
fi

SHA=$(cat .deploy_sha)
echo "deploying ${SHA}"

# Fetched beside the live file rather than over it.
# curl truncates its output file before it knows the request succeeded,
# so writing directly would leave no working composition behind after a bad SHA or a dropped connection.
curl -fsSL \
  "https://raw.githubusercontent.com/${REPO}/${SHA}/docker-compose.prod.yml" \
  -o docker-compose.yml.new
mv docker-compose.yml.new docker-compose.yml

chmod 600 .env.api .env.webhook

# Compose reads this, not .deploy_sha.
export GLASS_SHA="$SHA"

docker compose config --quiet
docker compose pull
docker compose up -d

wait_for_health() {
  local url="$1"
  local i
  for i in $(seq 1 30); do
    if curl -fsS -o /dev/null "$url"; then
      echo "healthy ${url}"
      return 0
    fi
    sleep 1
  done
  echo "health check failed: ${url}" >&2
  docker compose ps
  docker compose logs --tail=80
  return 1
}

wait_for_health http://127.0.0.1:7070/health
wait_for_health http://127.0.0.1:7071/health

# Docker snapshots the host's resolvers at container creation,
# so a host that has lost MagicDNS produces an API that is healthy but cannot sign anyone in.
if ! docker compose exec -T api node -e '
  fetch(process.env.OIDC_ISSUER + "/.well-known/openid-configuration", { signal: AbortSignal.timeout(10000) })
    .then((r) => { if (!r.ok) { console.error("OIDC discovery returned " + r.status); process.exit(1); } })
    .catch((e) => { console.error(e.cause ?? e); process.exit(1); });
'; then
  echo "api cannot reach OIDC discovery; check /etc/resolv.conf on the host" >&2
  docker compose exec -T api cat /etc/resolv.conf >&2 || true
  exit 1
fi
echo "api reaches OIDC discovery"

docker compose ps
