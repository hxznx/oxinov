#!/usr/bin/env bash
# Prepares the k3s node (ADR-018). Idempotent: safe on every deploy; changes only what differs.
# Runs as root on the starter server (Amazon Linux 2023), normally from deploy.sh over Systems Manager.
#
# Installs pinned k3s and Helm (verified by SHA-256), configures Traefik (HTTP to HTTPS, Let's Encrypt,
# no dashboard), creates the namespace, application secrets (generated once into Parameter Store), and
# the ECR pull secret with a 6-hourly refresh timer. Everything runs with the instance role: no keys.
set -euo pipefail

K3S_VERSION=v1.36.4+k3s1
K3S_SHA256=835873f37245fc615f547a2fe2af9402a347875f13fa64a1f136de644955ea3f
K3S_INSTALL_SHA256=46177d4c99440b4c0311b67233823a8e8a2fc09693f6c89af1a7161e152fbfad
HELM_VERSION=v4.3.0
HELM_SHA256=86584a54def73570558f66f5111cc53dfed56689637ae32c1201205d494f54fb

NAMESPACE=oxinov
PREFIX=/oxinov/production/starter
REGISTRY=${REGISTRY:?registry host, e.g. 614130400110.dkr.ecr.ap-south-1.amazonaws.com}
ACME_EMAIL=${ACME_EMAIL:-admin@oxinov.com}
export AWS_REGION=ap-south-1 AWS_DEFAULT_REGION=ap-south-1
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
PATH=/usr/local/bin:$PATH
umask 077

log() { printf '%s bootstrap: %s\n' "$(date -u +%FT%TZ)" "$*"; }
fetch() { curl -fsSL --retry 3 -o "$2" "$1"; }
verify() { echo "$2  $1" | sha256sum -c --quiet -; }

# --- Operating system: leave only what k3s needs ----------------------------------------------------
dnf install -y -q jq tar gzip >/dev/null
# The earlier Compose runtime is retired (ADR-018); Docker would compete with k3s for memory.
if systemctl is-enabled docker >/dev/null 2>&1; then
  log "retiring the Docker runtime"
  systemctl disable --now docker docker.socket >/dev/null 2>&1 || true
fi

# --- k3s ------------------------------------------------------------------------------------------
mkdir -p /etc/rancher/k3s /var/lib/rancher/k3s/server/manifests
cat > /etc/rancher/k3s/config.yaml <<'EOF'
# Single-node k3s for the starter server (ADR-018). Keep it small: the budget is US$50 a month.
write-kubeconfig-mode: "0600"
secrets-encryption: true
disable:
  - metrics-server
kubelet-arg:
  # 2 GiB of swap absorbs short peaks on the 4 GiB server.
  - fail-swap-on=false
  - image-gc-high-threshold=80
  - image-gc-low-threshold=60
  - max-pods=60
  - system-reserved=cpu=100m,memory=256Mi
  - eviction-hard=memory.available<150Mi,nodefs.available<10%
EOF

if [ "$(k3s --version 2>/dev/null | awk 'NR==1 {print $3}')" != "$K3S_VERSION" ]; then
  log "installing k3s $K3S_VERSION"
  work=$(mktemp -d)
  fetch "https://github.com/k3s-io/k3s/releases/download/${K3S_VERSION/+/%2B}/k3s" "$work/k3s"
  verify "$work/k3s" "$K3S_SHA256"
  install -m 0755 "$work/k3s" /usr/local/bin/k3s
  fetch "https://raw.githubusercontent.com/k3s-io/k3s/$K3S_VERSION/install.sh" "$work/install.sh"
  verify "$work/install.sh" "$K3S_INSTALL_SHA256"
  INSTALL_K3S_SKIP_DOWNLOAD=true INSTALL_K3S_VERSION=$K3S_VERSION sh "$work/install.sh" >/dev/null
  rm -rf "$work"
fi
systemctl enable --now k3s >/dev/null
for _ in $(seq 60); do kubectl get nodes 2>/dev/null | grep -q ' Ready' && break; sleep 5; done
kubectl get nodes | grep -q ' Ready' || { log "k3s did not become ready"; exit 1; }

# --- Helm -------------------------------------------------------------------------------------------
if [ "$(helm version --template '{{.Version}}' 2>/dev/null)" != "$HELM_VERSION" ]; then
  log "installing Helm $HELM_VERSION"
  work=$(mktemp -d)
  fetch "https://get.helm.sh/helm-$HELM_VERSION-linux-amd64.tar.gz" "$work/helm.tgz"
  verify "$work/helm.tgz" "$HELM_SHA256"
  tar -xzf "$work/helm.tgz" -C "$work"
  install -m 0755 "$work/linux-amd64/helm" /usr/local/bin/helm
  rm -rf "$work"
fi

# --- Traefik (bundled with k3s): HTTPS redirect, Let's Encrypt, security headers -------------------
cat > /var/lib/rancher/k3s/server/manifests/traefik-config.yaml <<EOF
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    ports:
      web:
        redirections:
          entryPoint:
            to: websecure
            scheme: https
            permanent: true
      websecure:
        http3:
          enabled: false
    ingressRoute:
      dashboard:
        enabled: false
    logs:
      access:
        enabled: false
    resources:
      requests: { cpu: 50m, memory: 64Mi }
      limits: { memory: 160Mi }
    persistence:
      enabled: true
      size: 128Mi
      path: /data
    certificatesResolvers:
      letsencrypt:
        acme:
          email: $ACME_EMAIL
          storage: /data/acme.json
          httpChallenge:
            entryPoint: web
    # acme.json must be private to Traefik on the persistent volume.
    deployment:
      initContainers:
        - name: volume-permissions
          image: busybox:1.37@sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e
          command: ["sh", "-c", "touch /data/acme.json && chmod 600 /data/acme.json && chown 65532:65532 /data /data/acme.json"]
          securityContext:
            runAsUser: 0
            runAsNonRoot: false
          volumeMounts:
            - name: data
              mountPath: /data
    podSecurityContext:
      fsGroup: 65532
EOF

# --- Namespace and application secrets --------------------------------------------------------------
kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || kubectl create namespace "$NAMESPACE" >/dev/null

param() { aws ssm get-parameter --name "$PREFIX/$1" --with-decryption --query Parameter.Value --output text 2>/dev/null || true; }
put_param() { aws ssm put-parameter --name "$PREFIX/$1" --type SecureString --value "$2" --overwrite >/dev/null; }
# Creates a random secret the first time only; existing values are never rotated by a deploy.
ensure_secret() {
  if [ -z "$(param "$1")" ]; then
    put_param "$1" "$(openssl rand -base64 96 | tr -dc 'A-Za-z0-9' | head -c "${2:-40}")"
    log "generated $1"
  fi
}
for name in POSTGRES_PASSWORD APP_DB_PASSWORD PLATFORM_APP_DB_PASSWORD KEYCLOAK_DB_PASSWORD KEYCLOAK_ADMIN_PASSWORD; do
  ensure_secret "$name"
done
ensure_secret EDU_SESSION_SECRET 64
ensure_secret PLATFORM_SESSION_SECRET 64

# Renders the Kubernetes Secret from Parameter Store (values never printed). Client secrets exist only
# after the realm is configured; a placeholder keeps pods starting until then.
sync_app_secret() {
  local args=() name value
  for name in POSTGRES_PASSWORD APP_DB_PASSWORD PLATFORM_APP_DB_PASSWORD KEYCLOAK_DB_PASSWORD KEYCLOAK_ADMIN_PASSWORD \
    EDU_SESSION_SECRET PLATFORM_SESSION_SECRET EDU_OIDC_CLIENT_SECRET PLATFORM_OIDC_CLIENT_SECRET; do
    value=$(param "$name")
    args+=("--from-literal=$name=${value:-pending-realm-configuration}")
  done
  kubectl -n "$NAMESPACE" create secret generic oxinov-app "${args[@]}" --dry-run=client -o yaml | kubectl apply -f - >/dev/null
}
sync_app_secret

# --- ECR pull secret, refreshed every 6 hours by the instance role (tokens last 12 hours) -------------
cat > /usr/local/bin/oxinov-ecr-pull-secret <<EOF
#!/bin/bash
set -euo pipefail
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml AWS_REGION=ap-south-1
token=\$(aws ecr get-login-password)
/usr/local/bin/kubectl -n $NAMESPACE create secret docker-registry ecr-pull \\
  --docker-server=$REGISTRY --docker-username=AWS --docker-password="\$token" \\
  --dry-run=client -o yaml | /usr/local/bin/kubectl apply -f - >/dev/null
EOF
chmod 700 /usr/local/bin/oxinov-ecr-pull-secret
cat > /etc/systemd/system/oxinov-ecr-pull-secret.service <<'EOF'
[Unit]
Description=Refresh the ECR image pull secret for k3s
After=k3s.service
[Service]
Type=oneshot
ExecStart=/usr/local/bin/oxinov-ecr-pull-secret
EOF
cat > /etc/systemd/system/oxinov-ecr-pull-secret.timer <<'EOF'
[Unit]
Description=Refresh the ECR image pull secret every 6 hours
[Timer]
OnBootSec=2min
OnUnitActiveSec=6h
Persistent=true
[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now oxinov-ecr-pull-secret.timer >/dev/null
/usr/local/bin/oxinov-ecr-pull-secret

log "node ready: k3s $K3S_VERSION, Helm $HELM_VERSION"
