import type { BookmarkBackupItem, BookmarkModel } from './types';

export async function exportBookmarkBackup(db: D1Database): Promise<BookmarkBackupItem[]> {
  const result = await db.prepare('SELECT * FROM bookmark ORDER BY id ASC').all<BookmarkModel>();
  return (result.results || []).map((row) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    show: row.show === 1,
  }));
}

export function appendBookmarkImportStatements(
  db: D1Database,
  rows: BookmarkBackupItem[],
  statements: D1PreparedStatement[],
): void {
  for (const row of rows) {
    statements.push(db.prepare(`
      INSERT INTO bookmark (id, name, url, show)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        url = excluded.url,
        show = excluded.show
    `).bind(row.id, row.name, row.url, row.show ? 1 : 0));
  }
}
