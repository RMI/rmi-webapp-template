#!/bin/sh
set -eu

# This script runs automatically on first database initialization
# via /docker-entrypoint-initdb.d.
#
# It bootstraps two roles:
#   - app_migrator: DDL + seed (used by DB migrations job)
#   - app_user:      runtime access only (used by API)
#
# Passwords and DB name are taken from environment variables.
#
# Required env:
#   POSTGRES_DB
#   POSTGRES_USER
#   POSTGRES_PASSWORD (used by the container when starting Postgres)
#   APP_MIGRATOR_PASSWORD
#   APP_USER_PASSWORD
#
# This script:
#  - checks whether app_migrator / app_user exist
#  - creates them if missing, using psql -v + :'var' substitution so passwords are safely quoted
#  - applies grants / default privileges

: "${POSTGRES_DB:?POSTGRES_DB must be set}"
: "${POSTGRES_USER:?POSTGRES_USER must be set}"
: "${APP_MIGRATOR_PASSWORD:?APP_MIGRATOR_PASSWORD must be set}"
: "${APP_USER_PASSWORD:?APP_USER_PASSWORD must be set}"

escape_sql_literal() {
  # Replace each single quote ' with two single quotes '' (Postgres escaping)
  printf '%s' "$1" | sed "s/'/''/g"
}

# 1) create app_migrator
if [ -z "$(
  psql -tA -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -c "SELECT 1 FROM pg_roles WHERE rolname='app_migrator'"
)" ]; then
  MIG_ESCAPED=$(escape_sql_literal "$APP_MIGRATOR_PASSWORD")
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -c "CREATE ROLE app_migrator LOGIN PASSWORD '$MIG_ESCAPED';"
else
  echo "app_migrator already exists"
fi

# 2) create app_user
if [ -z "$(
  psql -tA -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -c "SELECT 1 FROM pg_roles WHERE rolname='app_user'"
)" ]; then
  APP_ESCAPED=$(escape_sql_literal "$APP_USER_PASSWORD")
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -c "CREATE ROLE app_user LOGIN PASSWORD '$APP_ESCAPED';"
else
  echo "app_user already exists"
fi

# 3) Grants: connect to DB (DB name is an identifier; we can use double-quoting safely via shell)
# Note: we avoid psql variable substitution for identifier here to keep things simple.
# If your DB name contains weird characters, you can use psql -v dbname="$POSTGRES_DB" -c 'GRANT CONNECT ON DATABASE :"dbname" TO ...'
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "GRANT CONNECT ON DATABASE \"$POSTGRES_DB\" TO app_migrator;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "GRANT CONNECT ON DATABASE \"$POSTGRES_DB\" TO app_user;"

# Schema-level grants (public schema)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "GRANT USAGE ON SCHEMA public TO app_migrator;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "GRANT USAGE ON SCHEMA public TO app_user;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "GRANT CREATE ON SCHEMA public TO app_migrator;"

# Default privileges so that objects created BY app_migrator are usable by app_user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO app_user;"

# Apply privileges to existing objects (defensive)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user;"

# Restrict default public schema creation
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "REVOKE CREATE ON SCHEMA public FROM PUBLIC;"
