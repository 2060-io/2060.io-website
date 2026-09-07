# 2060.io website — Helm chart

Deploys the 2060.io corporate website (Next.js 15 standalone) behind an
nginx ingress with Let's Encrypt TLS.

## Defaults

| Key | Value |
| --- | --- |
| `image.repository` | `io2060/website` |
| `image.tag` | empty → `v<Chart.AppVersion>` (e.g. `v1.0.0`) |
| `replicaCount` | `2` |
| `service.type` | `ClusterIP` |
| `service.port` | `80` |
| `service.targetPort` | `3000` (Next.js standalone listens on 3000) |
| `ingress.className` | `nginx` |
| `ingress.host` | `2060.io` |
| `ingress.tls.enabled` | `true` |
| `ingress.tls.secretName` | `website-2060-io-tls` |
| `ingress.annotations` | `cert-manager.io/cluster-issuer: letsencrypt-prod` |

## Install

```bash
helm upgrade --install website ./charts \
  --namespace web \
  --create-namespace \
  --set image.tag=v1.0.0   # or leave unset to default to v<AppVersion>, or use 'latest' / 'dev'
```

## CI

Deployment is triggered automatically by `.github/workflows/deploy.yml` on
every published GitHub release (the companion `.github/workflows/cd.yml`
builds the image). It authenticates against the OVH cluster using the
`OVH_KUBECONFIG` GitHub Actions **secret** (raw kubeconfig contents,
masked in logs).

Set it under *Settings → Secrets and variables → Actions → Secrets →
New repository secret*, name `OVH_KUBECONFIG`, value the full kubeconfig
YAML.

## Data room

`dataroom.enabled` (default `true`) adds the invitation-only investor data
room: an in-cluster Postgres StatefulSet (user/db `dataroom`, password from
the app Secret's `POSTGRES_PASSWORD`), a `-storage` PVC mounted at `/data`
(signed NDA PDFs + the document repository; kept on uninstall), and a
post-install/pre-upgrade hook Job that runs `prisma migrate deploy` plus the
idempotent seed (admin allowlist from `ADMIN_BOOTSTRAP_EMAILS`, NDA
activation from `dataroom.ndaFilename`) using the `migrate-<tag>` image
(Dockerfile `migrator` stage).

Credentials all live in the `2060-website-secrets` Secret, which
`ci/create-app-secret.sh` (called by both deploy workflows) mirrors 1:1 from
GitHub Actions secrets — set `POSTGRES_PASSWORD` (URL-safe/alphanumeric),
`AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, `AUTH_GITHUB_ID/SECRET`, `MAIL_*`,
and `ADMIN_BOOTSTRAP_EMAILS` there. While `POSTGRES_PASSWORD` is unset the
hook skips cleanly and the site deploys as before, with the data room simply
unconfigured.

Because the storage PVC is ReadWriteOnce, the app Deployment uses the
`Recreate` strategy while the data room is enabled (brief downtime per
deploy).
