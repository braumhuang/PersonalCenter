import { appendBookmarkImportStatements, exportBookmarkBackup } from '../bookmark/backup';
import { appendNotebookImportStatements, exportNotebookBackup } from '../notebook/backup';
import { appendPasswordImportStatements, exportPasswordBackup } from '../password/backup';
import { appendTodoitemImportStatements, exportTodoitemBackup } from '../todoitem/backup';
import { BACKUP_FORMAT, BACKUP_VERSION, type PersonalCenterBackup } from './backup-schema';

export async function createPersonalCenterBackup(db: D1Database, aesKey: string): Promise<PersonalCenterBackup> {
  const [passwords, bookmarks, notebooks, todoitems] = await Promise.all([
    exportPasswordBackup(db, aesKey),
    exportBookmarkBackup(db),
    exportNotebookBackup(db),
    exportTodoitemBackup(db),
  ]);

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    data: { passwords, bookmarks, notebooks, todoitems },
  };
}

export async function importPersonalCenterBackup(db: D1Database, aesKey: string, backup: PersonalCenterBackup) {
  const { passwords, bookmarks, notebooks, todoitems } = backup.data;
  const statements: D1PreparedStatement[] = [];

  await appendPasswordImportStatements(db, aesKey, passwords, statements);
  appendBookmarkImportStatements(db, bookmarks, statements);
  appendNotebookImportStatements(db, notebooks, statements);
  appendTodoitemImportStatements(db, todoitems, statements);

  const batchSize = 100;
  for (let index = 0; index < statements.length; index += batchSize) {
    await db.batch(statements.slice(index, index + batchSize));
  }

  return {
    total: passwords.length + bookmarks.length + notebooks.length + todoitems.length,
    counts: {
      passwords: passwords.length,
      bookmarks: bookmarks.length,
      notebooks: notebooks.length,
      todoitems: todoitems.length,
    },
  };
}
