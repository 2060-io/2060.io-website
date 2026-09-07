#!/usr/bin/env sh
# Creates/refreshes the `2060-website-secrets` Secret in the `web` namespace,
# mirroring GitHub Actions secrets 1:1 (plus DATABASE_URL, derived here from
# POSTGRES_PASSWORD — host/user/db are fixed by the chart's Postgres). Called
# by both deploy workflows so the two can't drift. Annotated keep so helm
# never prunes it.
#
# Expected in the environment (all optional; empty values just disable the
# feature they serve):
#   RELATICLE_API_TOKEN ALERT_WEBHOOK_URL
#   POSTGRES_PASSWORD AUTH_SECRET
#   AUTH_GOOGLE_ID AUTH_GOOGLE_SECRET AUTH_GITHUB_ID AUTH_GITHUB_SECRET
#   MAIL_HOST MAIL_PORT MAIL_USERNAME MAIL_PASSWORD MAIL_ENCRYPTION
#   GOOGLE_SA_EMAIL GOOGLE_SA_PRIVATE_KEY GOOGLE_CALENDAR_IMPERSONATE
#   MAIL_FROM_ADDRESS MAIL_FROM_NAME ADMIN_BOOTSTRAP_EMAILS
set -eu

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "::warning::POSTGRES_PASSWORD is empty - the data room stays unconfigured (migrations skip; Postgres won't start)."
  DATABASE_URL=""
else
  # Keep the password URL-safe (alphanumeric): it is embedded unencoded.
  DATABASE_URL="postgresql://dataroom:${POSTGRES_PASSWORD}@website-postgres:5432/dataroom?schema=public"
fi

kubectl create namespace web --dry-run=client -o yaml | kubectl apply -f -
kubectl -n web create secret generic 2060-website-secrets \
  --from-literal=RELATICLE_API_TOKEN="${RELATICLE_API_TOKEN:-}" \
  --from-literal=ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}" \
  --from-literal=POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}" \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --from-literal=AUTH_SECRET="${AUTH_SECRET:-}" \
  --from-literal=AUTH_GOOGLE_ID="${AUTH_GOOGLE_ID:-}" \
  --from-literal=AUTH_GOOGLE_SECRET="${AUTH_GOOGLE_SECRET:-}" \
  --from-literal=AUTH_GITHUB_ID="${AUTH_GITHUB_ID:-}" \
  --from-literal=AUTH_GITHUB_SECRET="${AUTH_GITHUB_SECRET:-}" \
  --from-literal=MAIL_HOST="${MAIL_HOST:-}" \
  --from-literal=MAIL_PORT="${MAIL_PORT:-}" \
  --from-literal=MAIL_USERNAME="${MAIL_USERNAME:-}" \
  --from-literal=MAIL_PASSWORD="${MAIL_PASSWORD:-}" \
  --from-literal=MAIL_ENCRYPTION="${MAIL_ENCRYPTION:-}" \
  --from-literal=MAIL_FROM_ADDRESS="${MAIL_FROM_ADDRESS:-}" \
  --from-literal=MAIL_FROM_NAME="${MAIL_FROM_NAME:-}" \
  --from-literal=ADMIN_BOOTSTRAP_EMAILS="${ADMIN_BOOTSTRAP_EMAILS:-}" \
  --from-literal=GOOGLE_SA_EMAIL="${GOOGLE_SA_EMAIL:-}" \
  --from-literal=GOOGLE_SA_PRIVATE_KEY="${GOOGLE_SA_PRIVATE_KEY:-}" \
  --from-literal=GOOGLE_CALENDAR_IMPERSONATE="${GOOGLE_CALENDAR_IMPERSONATE:-}" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n web annotate secret 2060-website-secrets \
  helm.sh/resource-policy=keep --overwrite
