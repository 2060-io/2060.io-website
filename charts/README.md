# 2060.io website — Helm chart

Deploys the 2060.io corporate website (Next.js 15 standalone) behind an
nginx ingress with Let's Encrypt TLS.

## Defaults

| Key | Value |
| --- | --- |
| `image.repository` | `io2060/website` |
| `image.tag` | empty → `Chart.AppVersion` |
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
  --set image.tag=v1.0.0
```

## CI

Deployment is triggered automatically by `.github/workflows/cd.yml` on every
published GitHub release. It authenticates against the OVH cluster using the
`OVH_KUBERNETES` GitHub Actions variable.

> **Security note:** `OVH_KUBERNETES` is a Variable (not a Secret) per the
> current configuration. A kubeconfig grants cluster access and is usually
> stored as a Secret. If the value contains raw kubeconfig credentials,
> consider moving it to `${{ secrets.OVH_KUBERNETES }}` and updating the
> workflow accordingly.
