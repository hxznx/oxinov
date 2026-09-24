#!/bin/sh
# Local Docker only: runs once when the postgres volume is first initialised. Creates the Keycloak
# database and its owner role with a login password from KEYCLOAK_DB_PASSWORD.
set -eu
: "${KEYCLOAK_DB_PASSWORD:?KEYCLOAK_DB_PASSWORD must be set}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v kc_password="$KEYCLOAK_DB_PASSWORD" <<'SQL'
CREATE ROLE keycloak LOGIN PASSWORD :'kc_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE keycloak OWNER keycloak;
SQL
