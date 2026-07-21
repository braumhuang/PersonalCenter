import type { TodoitemBackupItem, TodoitemModel } from './types';

export async function exportTodoitemBackup(db: D1Database): Promise<TodoitemBackupItem[]> {
  const result = await db.prepare('SELECT * FROM todoitem ORDER BY id ASC').all<TodoitemModel>();
  return (result.results || []).map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    todo_time: row.todo_time,
    done: row.done === 1,
  }));
}

export function appendTodoitemImportStatements(
  db: D1Database,
  rows: TodoitemBackupItem[],
  statements: D1PreparedStatement[],
): void {
  for (const row of rows) {
    statements.push(db.prepare(`
      INSERT INTO todoitem (id, title, content, todo_time, done)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        todo_time = excluded.todo_time,
        done = excluded.done
    `).bind(row.id, row.title, row.content, row.todo_time, row.done ? 1 : 0));
  }
}
