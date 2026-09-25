#!/bin/sh
# Starter server (ADR-017): runs once when the PostgreSQL volume is first initialised. Creates the
# least-privilege request roles and the platform and Keycloak databases. Passwords come from the
# environment, which deploy.sh renders from Parameter Store; migrations then grant table privileges.
set -eu
: "${APP_DB_PASSWORD:?}" "${PLATFORM_APP_DB_PASSWORD:?}" "${KEYCLOAK_DB_PASSWORD:?}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v app_password="$APP_DB_PASSWORD" \
  -v platform_password="$PLATFORM_APP_DB_PASSWORD" \
  -v kc_password="$KEYCLOAK_DB_PASSWORD" <<'SQL'
CREATE ROLE oxinov_app LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
CREATE DATABASE oxinov_platform;
CREATE ROLE oxinov_platform_app LOGIN PASSWORD :'platform_password'
  NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
CREATE ROLE keycloak LOGIN PASSWORD :'kc_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE keycloak OWNER keycloak;
SQL
