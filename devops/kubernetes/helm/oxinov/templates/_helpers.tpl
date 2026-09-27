{{/* Common labels. */}}
{{- define "oxinov.labels" -}}
app.kubernetes.io/part-of: oxinov
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end -}}

{{/* priorityClassName line for a workload tier (ADR-022); empty when priority classes are off. */}}
{{- define "oxinov.priority" -}}
{{- if .root.Values.priorityClasses.enabled -}}
priorityClassName: {{ printf "oxinov-%s" (.tier | default "core") }}
{{- end }}
{{- end -}}

{{/* Image reference: registry/image:tag, where the service tag wins over global.tag. */}}
{{- define "oxinov.image" -}}
{{- $tag := .tag | default .root.Values.global.tag -}}
{{- if not $tag -}}{{- fail (printf "set global.tag or a tag for %s" .name) -}}{{- end -}}
{{ .root.Values.global.registry }}/{{ .image }}:{{ $tag }}
{{- end -}}

{{/* An environment variable from the shared application Secret. */}}
{{- define "oxinov.secretEnv" -}}
- name: {{ .name }}
  valueFrom:
    secretKeyRef:
      name: {{ .root.Values.global.existingSecret }}
      key: {{ .key | default .name }}
{{- end -}}

{{/* Hardened container defaults shared by every workload. */}}
{{- define "oxinov.containerSecurity" -}}
securityContext:
  runAsNonRoot: true
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: {{ .readOnly }}
  capabilities:
    drop: [ALL]
  seccompProfile:
    type: RuntimeDefault
{{- end -}}

{{/* PostgreSQL connection URL; the password is expanded by Kubernetes from an earlier env var. */}}
{{- define "oxinov.dbUrl" -}}
postgresql://{{ .user }}:$({{ .passwordVar }})@{{ .root.Values.postgres.host }}:5432/{{ .database }}
{{- end -}}

{{/* Environment of each service; secrets are always references, never values. */}}
{{- define "oxinov.env" -}}
{{- $root := .root -}}
{{- $issuer := printf "https://id.%s/realms/oxinov" $root.Values.global.domain -}}
{{- $jwks := "http://keycloak:8080/realms/oxinov/protocol/openid-connect/certs" -}}
{{- if eq .name "edu-api" }}
- { name: NODE_ENV, value: production }
- { name: DEPLOY_ENVIRONMENT, value: production }
- { name: PORT, value: "4000" }
- { name: SERVICE_VERSION, value: {{ .tag | quote }} }
- { name: AUTH_ISSUER, value: {{ $issuer | quote }} }
- { name: AUTH_JWKS_URL, value: {{ $jwks | quote }} }
- { name: AUTH_AUDIENCE, value: oxinov-lms-api }
- { name: MEDIA_BUCKET, value: {{ $root.Values.media.bucket | quote }} }
- { name: MEDIA_S3_REGION, value: {{ $root.Values.media.region | quote }} }
- { name: AWS_REGION, value: {{ $root.Values.media.region | quote }} }
{{ include "oxinov.secretEnv" (dict "root" $root "name" "APP_DB_PASSWORD") }}
- name: DATABASE_URL
  value: {{ include "oxinov.dbUrl" (dict "root" $root "user" "oxinov_app" "passwordVar" "APP_DB_PASSWORD" "database" "oxinov_lms") | quote }}
{{- /* Paid courses (ADR-023): provider keys are optional Secret entries; a missing key keeps that provider off. */}}
- { name: PAYMENTS_MODE, value: {{ $root.Values.payments.mode | quote }} }
- { name: PAYMENTS_SELLER_TENANT_IDS, value: {{ $root.Values.payments.sellerTenantIds | quote }} }
- { name: EDU_WEB_URL, value: {{ printf "https://edu.%s" $root.Values.global.domain | quote }} }
{{- range list "KHALTI_SECRET_KEY" "ESEWA_PRODUCT_CODE" "ESEWA_SECRET_KEY" }}
- name: {{ . }}
  valueFrom:
    secretKeyRef:
      name: {{ $root.Values.global.existingSecret }}
      key: {{ . }}
      optional: true
{{- end }}
{{- else if eq .name "platform-api" }}
- { name: NODE_ENV, value: production }
- { name: DEPLOY_ENVIRONMENT, value: production }
- { name: PORT, value: "4200" }
- { name: SERVICE_VERSION, value: {{ .tag | quote }} }
- { name: AUTH_ISSUER, value: {{ $issuer | quote }} }
- { name: AUTH_JWKS_URL, value: {{ $jwks | quote }} }
- { name: AUTH_AUDIENCE, value: oxinov-platform-api }
{{ include "oxinov.secretEnv" (dict "root" $root "name" "PLATFORM_APP_DB_PASSWORD") }}
- name: DATABASE_URL
  value: {{ include "oxinov.dbUrl" (dict "root" $root "user" "oxinov_platform_app" "passwordVar" "PLATFORM_APP_DB_PASSWORD" "database" "oxinov_platform") | quote }}
{{- else if eq .name "edu-web" }}
- { name: APP_URL, value: {{ printf "https://edu.%s" $root.Values.global.domain | quote }} }
- { name: ACCOUNT_URL, value: {{ printf "https://app.%s" $root.Values.global.domain | quote }} }
- { name: OIDC_ISSUER, value: {{ $issuer | quote }} }
- { name: OIDC_CLIENT_ID, value: oxinov-edu-web }
- { name: EDU_API_URL, value: "http://edu-api:4000" }
{{ include "oxinov.secretEnv" (dict "root" $root "name" "OIDC_CLIENT_SECRET" "key" "EDU_OIDC_CLIENT_SECRET") }}
{{ include "oxinov.secretEnv" (dict "root" $root "name" "SESSION_SECRET" "key" "EDU_SESSION_SECRET") }}
{{- else if eq .name "platform-web" }}
- { name: APP_URL, value: {{ printf "https://app.%s" $root.Values.global.domain | quote }} }
- { name: OIDC_ISSUER, value: {{ $issuer | quote }} }
- { name: OIDC_CLIENT_ID, value: oxinov-platform-web }
- { name: PLATFORM_API_URL, value: "http://platform-api:4200" }
{{ include "oxinov.secretEnv" (dict "root" $root "name" "OIDC_CLIENT_SECRET" "key" "PLATFORM_OIDC_CLIENT_SECRET") }}
{{ include "oxinov.secretEnv" (dict "root" $root "name" "SESSION_SECRET" "key" "PLATFORM_SESSION_SECRET") }}
{{- else if eq .name "keycloak" }}
- { name: KC_DB_URL, value: {{ printf "jdbc:postgresql://%s:5432/keycloak" $root.Values.postgres.host | quote }} }
- { name: KC_DB_USERNAME, value: keycloak }
- { name: KC_HOSTNAME, value: {{ printf "https://id.%s" $root.Values.global.domain | quote }} }
- { name: KC_HOSTNAME_ADMIN, value: {{ $root.Values.identity.adminHostname | quote }} }
- { name: KC_HTTP_ENABLED, value: "true" }
- { name: KC_PROXY_HEADERS, value: xforwarded }
- { name: KC_BOOTSTRAP_ADMIN_USERNAME, value: {{ $root.Values.identity.adminUser | quote }} }
- { name: JAVA_OPTS_KC_HEAP, value: {{ .svc.heap | quote }} }
{{ include "oxinov.secretEnv" (dict "root" $root "name" "KC_DB_PASSWORD" "key" "KEYCLOAK_DB_PASSWORD") }}
{{ include "oxinov.secretEnv" (dict "root" $root "name" "KC_BOOTSTRAP_ADMIN_PASSWORD" "key" "KEYCLOAK_ADMIN_PASSWORD") }}
{{- else if eq .name "mail-relay" }}
- { name: MAIL_FROM, value: {{ $root.Values.mail.from | quote }} }
- { name: AWS_REGION, value: {{ $root.Values.media.region | quote }} }
{{- end }}
{{- /* Plain settings from the service's values entry (services scaffolded by `oxctl new-service`). */}}
{{- range $key, $value := .svc.env }}
- { name: {{ $key }}, value: {{ $value | toString | quote }} }
{{- end }}
{{- end -}}
