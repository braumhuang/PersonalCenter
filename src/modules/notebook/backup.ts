import type { NotebookBackupItem, NotebookModel } from './types';

export async function exportNotebookBackup(db: D1Database): Promise<NotebookBackupItem[]> {
  const result = await db.prepare('SELECT * FROM notebook ORDER BY id ASC').all<NotebookModel>();
  return (result.results || []).map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    create_time: row.create_time,
  }));
}

export function appendNotebookImportStatements(
  db: D1Database,
  rows: NotebookBackupItem[],
  statements: D1PreparedStatement[],
): void {
  for (const row of rows) {
    statements.push(db.prepare(`
      INSERT INTO notebook (id, title, content, create_time)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        create_time = excluded.create_time
    `).bind(row.id, row.title, row.content, row.create_time));
  }
}
