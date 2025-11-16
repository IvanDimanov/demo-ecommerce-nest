import { styleText } from 'node:util';
import { db, migrator } from './migrator';

async function migrateUp(): Promise<void> {
  const { error, results } = await migrator.migrateUp();
  if (error) {
    console.error('❌ Failed to execute a DB Migration Up');
    console.error(error);

    await db.destroy();
    process.exit(1);
  }

  if (!results || !results.length) {
    console.log(
      `🏁 No DB Migrations to ${styleText('bold', 'run up')} - your Database is up-to-date`,
    );
    await db.destroy();
    return;
  }

  results.forEach((iteration) => {
    if (iteration.status === 'Success') {
      console.log(
        `✅⬆️ DB Migration "${styleText('bold', iteration.migrationName)}" was executed ${styleText('bold', 'up')} successfully`,
      );
    } else if (iteration.status === 'Error') {
      console.error(
        `❌ Failed to execute DB Migration: "${styleText('bold', iteration.migrationName)}"`,
      );
    } else {
      console.error(
        `❔ Unknown DB Migration status "${iteration.status}" for file: "${styleText('bold', iteration.migrationName)}"`,
      );
    }
  });

  await db.destroy();
}

void migrateUp();
