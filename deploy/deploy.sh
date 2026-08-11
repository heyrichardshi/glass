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

chmod 600 .env.api

# Compose reads this, not .deploy_sha.
export GLASS_SHA="$SHA"

docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps
