/**
 * More about Kysely migrator can be read here:
 * https://www.kysely.dev/docs/migrations#running-migrations
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { cwd } from 'node:process';

import { Kysely, Migrator, MysqlDialect, FileMigrationProvider } from 'kysely';
import { createPool } from 'mysql2';

import { envVars } from '../common/utils/getEnvVars';
import type { DB } from '../common/dto/main-database.dto';

const DB_MIGRATIONS_FOLDER_PATH = path.join(cwd(), './src/database/migrations');

export const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: createPool({
      database: envVars.MYSQL_DATABASE,
      host: envVars.MYSQL_HOST,
      port: envVars.MYSQL_TCP_PORT,
      user: envVars.MYSQL_USER,
      password: envVars.MYSQL_PASSWORD,
    }),
  }),
});

export const migrator = new Migrator({
  db,
  allowUnorderedMigrations: true,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: DB_MIGRATIONS_FOLDER_PATH,
  }),
});
