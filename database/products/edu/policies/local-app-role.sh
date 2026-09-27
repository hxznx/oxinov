#!/bin/sh
# Local Docker only: runs once when the postgres volume is first initialised
# (mounted into /docker-entrypoint-initdb.d by docker-compose.yml). Creates the
# least-privilege request role with a login password from APP_DB_PASSWORD.
# Migration 20260924000200_tenant_isolation grants its table privileges.
# Staging and production create this login through their secret-managed provisioning instead.
set -eu
: "${APP_DB_PASSWORD:?APP_DB_PASSWORD must be set}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v app_password="$APP_DB_PASSWORD" <<'SQL'
CREATE ROLE oxinov_app LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
SQL
