import { document } from '../../components/render';
import type { App } from '../../types';
import { getZoneTimeStr } from '../../utils';
import type { NotebookModel } from './types';
import { NotebookAddPage, NotebookEditPage, NotebookListPage } from './views';

export function registerNotebookModule(app: App): void {
  app.get('/admin/notebook', async (c) => {
    const q = c.req.query('q') || '';
    let query = 'SELECT * FROM notebook';
    let params: any[] = [];
    if (q) {
      query += ' WHERE title LIKE ? OR content LIKE ?';
      params = [`%${q}%`, `%${q}%`];
    }
    query += ' ORDER BY create_time DESC';
    const res = await c.env.DB.prepare(query).bind(...params).all<NotebookModel>();
    const rows = (res.results || []).map((record) => [
      record.id.toString(),
      record.title,
      record.content.length > 50 ? `${record.content.substring(0, 50)}...` : record.content,
      record.create_time,
    ]);
    return c.html(document(<NotebookListPage rows={rows} searchVal={q} userName={c.env.USER_NAME} />));
  });

  app.get('/admin/notebook/add', (c) => c.html(document(<NotebookAddPage userName={c.env.USER_NAME} />)));

  app.get('/admin/notebook/edit', async (c) => {
    const id = c.req.query('id') || '';
    const record = await c.env.DB.prepare('SELECT * FROM notebook WHERE id = ?').bind(id).first<NotebookModel>();
    if (!record) return c.text('记录不存在');
    return c.html(document(<NotebookEditPage record={record} userName={c.env.USER_NAME} />));
  });

  app.get('/admin/notebook/delete-single', async (c) => {
    const id = c.req.query('id') || '';
    await c.env.DB.prepare('DELETE FROM notebook WHERE id = ?').bind(id).run();
    return c.redirect('/admin/notebook');
  });

  app.post('/admin/notebook/save', async (c) => {
    const body = await c.req.parseBody();
    const timeStr = (body.create_time as string) || getZoneTimeStr(c.env.TIME_ZONE);
    if (body.id) {
      await c.env.DB.prepare('UPDATE notebook SET title=?, content=?, create_time=? WHERE id=?').bind(body.title, body.content, timeStr, body.id).run();
    } else {
      await c.env.DB.prepare('INSERT INTO notebook (title, content, create_time) VALUES (?, ?, ?)').bind(body.title, body.content, timeStr).run();
    }
    return c.redirect('/admin/notebook');
  });

  app.post('/admin/notebook/delete-selected', async (c) => {
    const body = await c.req.parseBody();
    const formData = await c.req.formData();
    const ids = formData.getAll('selected_ids');
    if (body.action === 'delete' && ids.length > 0) {
      for (const id of ids) {
        await c.env.DB.prepare('DELETE FROM notebook WHERE id = ?').bind(id).run();
      }
    }
    return c.redirect('/admin/notebook');
  });
}
