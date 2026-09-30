#!/usr/bin/env bash
# Generated from services.yaml by scripts/service_catalog.py. Do not edit; edit services.yaml.
# Sourced by the release planner, deploy.sh, the deploy workflow, rehearse-local.sh and oxctl.
# shellcheck disable=SC2034

# Every built image, in release manifest order.
CATALOG_SERVICES=(lms-api platform-api edu-web platform-web migrate mail-relay keycloak backup)
# Kubernetes Deployments in the chart (plus postgres, which the chart owns directly).
CATALOG_WORKLOADS=(edu-api platform-api edu-web platform-web mail-relay keycloak)

# Extended regular expression of the paths an image is built from.
catalog_inputs() {
  case $1 in
    lms-api) echo '^(backend/products/edu-api/|packages/server-kit/|database/products/edu/prisma/|security/soc/event-schema\.json$)' ;;
    platform-api) echo '^(backend/platform-api/|packages/server-kit/|database/platform/prisma/|security/soc/event-schema\.json$)' ;;
    edu-web) echo '^(frontend/products/edu-web/|packages/web-auth/|packages/design-system/)' ;;
    platform-web) echo '^(frontend/platform-web/|packages/web-auth/|packages/design-system/)' ;;
    migrate) echo '^(database/products/edu/migrations/|database/products/edu/prisma/|database/platform/migrations/|database/platform/prisma/|backend/workers/migrate/)' ;;
    mail-relay) echo '^(backend/workers/mail-relay/)' ;;
    keycloak) echo '^(devops/keycloak/Dockerfile$|devops/keycloak/themes/)' ;;
    backup) echo '^(devops/docker/Dockerfile$)' ;;
    *) echo "unknown service $1" >&2; return 1 ;;
  esac
}

# Succeeds when the image is rebuilt on shared Node.js workspace changes.
catalog_node() {
  case $1 in
    lms-api|platform-api|edu-web|platform-web|migrate|mail-relay) return 0 ;;
    *) return 1 ;;
  esac
}

# Prints: <dockerfile> <context> <target or -> <trivyignore or ->
catalog_build() {
  case $1 in
    lms-api) echo 'devops/docker/Dockerfile . backend -' ;;
    platform-api) echo 'devops/docker/Dockerfile . platform-api -' ;;
    edu-web) echo 'devops/docker/Dockerfile . edu-web -' ;;
    platform-web) echo 'devops/docker/Dockerfile . platform-web -' ;;
    migrate) echo 'devops/docker/Dockerfile . migrate -' ;;
    mail-relay) echo 'devops/docker/Dockerfile . mail-relay -' ;;
    keycloak) echo 'devops/keycloak/Dockerfile devops/keycloak - devops/keycloak/.trivyignore' ;;
    backup) echo 'devops/docker/Dockerfile . backup -' ;;
    *) echo "unknown service $1" >&2; return 1 ;;
  esac
}

# Release manifest variable -> Helm value holding it.
catalog_helm_key() {
  case $1 in
    TAG_LMS_API) echo 'services.edu-api.tag' ;;
    TAG_PLATFORM_API) echo 'services.platform-api.tag' ;;
    TAG_EDU_WEB) echo 'services.edu-web.tag' ;;
    TAG_PLATFORM_WEB) echo 'services.platform-web.tag' ;;
    TAG_MIGRATE) echo 'migrations.tag' ;;
    TAG_MAIL_RELAY) echo 'services.mail-relay.tag' ;;
    TAG_KEYCLOAK) echo 'services.keycloak.tag' ;;
    TAG_BACKUP) echo 'backup.tag' ;;
    DEPLOYED_SHA) echo 'global.deployedSha' ;;
    *) return 1 ;;
  esac
}

catalog_tag_var() { echo "TAG_$(echo "$1" | tr 'a-z-' 'A-Z_')"; }
