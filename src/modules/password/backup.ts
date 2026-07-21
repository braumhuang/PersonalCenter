import { decryptPswd, encryptPswd } from '../../utils';
import type { PasswordBackupItem, PasswordModel } from './types';

export async function exportPasswordBackup(db: D1Database, aesKey: string): Promise<PasswordBackupItem[]> {
  const result = await db.prepare('SELECT * FROM password ORDER BY note ASC').all<PasswordModel>();
  return Promise.all((result.results || []).map(async (row) => ({
    note: row.note,
    name: row.name,
    password: await decryptPswd(row.pswd, aesKey),
    urls: row.urls,
    info: row.info || '',
  })));
}

export async function appendPasswordImportStatements(
  db: D1Database,
  aesKey: string,
  rows: PasswordBackupItem[],
  statements: D1PreparedStatement[],
): Promise<void> {
  for (const row of rows) {
    const encryptedPassword = await encryptPswd(row.password, aesKey);
    statements.push(db.prepare(`
      INSERT INTO password (note, name, pswd, urls, info)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(note) DO UPDATE SET
        name = excluded.name,
        pswd = excluded.pswd,
        urls = excluded.urls,
        info = excluded.info
    `).bind(row.note, row.name, encryptedPassword, row.urls, row.info));
  }
}
