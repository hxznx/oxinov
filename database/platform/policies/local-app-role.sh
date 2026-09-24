#!/bin/sh
# Local Docker only: runs once when the postgres volume is first initialised. Creates the platform
# database and its least-privilege request role with a login password from PLATFORM_APP_DB_PASSWORD.
# Migration 20260924100200_owner_isolation grants the table privileges.
set -eu
: "${PLATFORM_APP_DB_PASSWORD:?PLATFORM_APP_DB_PASSWORD must be set}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v app_password="$PLATFORM_APP_DB_PASSWORD" <<'SQL'
CREATE DATABASE oxinov_platform;
CREATE ROLE oxinov_platform_app LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
SQL
