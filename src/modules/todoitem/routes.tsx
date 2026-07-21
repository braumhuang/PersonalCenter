import { document } from '../../components/render';
import type { App } from '../../types';
import { getZoneTimeStr } from '../../utils';
import type { TodoitemModel } from './types';
import { TodoitemAddPage, TodoitemEditPage, TodoitemListPage } from './views';

export function registerTodoitemModule(app: App): void {
  app.get('/admin/todoitem', async (c) => {
    const q = c.req.query('q') || '';
    const status = c.req.query('status') || 'pending';
    const nowStr = getZoneTimeStr(c.env.TIME_ZONE);
    let query = 'SELECT * FROM todoitem WHERE 1=1';
    const params: any[] = [];

    if (status === 'pending') {
      query += ' AND done = 0 AND todo_time >= ?';
      params.push(nowStr);
    } else if (status === 'completed') {
      query += ' AND done = 1';
    } else if (status === 'expired') {
      query += ' AND done = 0 AND todo_time < ?';
      params.push(nowStr);
    }

    if (q) {
      query += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    if (status === 'pending' || status === 'completed') query += ' ORDER BY todo_time ASC';
    else query += ' ORDER BY todo_time DESC';

    const res = await c.env.DB.prepare(query).bind(...params).all<TodoitemModel>();
    const rows = (res.results || []).map((record) => {
      let stateLabel = '';
      if (record.done === 1) stateLabel = '<span class="status-completed">已完成</span>';
      else if (record.todo_time < nowStr) stateLabel = '<span class="status-expired">已过期</span>';
      else stateLabel = '<span class="status-pending">进行中</span>';
      return [
        record.id.toString(),
        record.title,
        record.todo_time,
        stateLabel,
        `<input type="checkbox" ${record.done === 1 ? 'checked' : ''} data-toggle-endpoint="todoitem" data-record-id="${record.id}">`,
      ];
    });

    return c.html(document(<TodoitemListPage rows={rows} searchVal={q} status={status} userName={c.env.USER_NAME} />));
  });

  app.post('/admin/todoitem/toggle-field', async (c) => {
    const body = await c.req.json();
    const doneVal = body.checked ? 1 : 0;
    await c.env.DB.prepare('UPDATE todoitem SET done = ? WHERE id = ?').bind(doneVal, body.id).run();
    return c.json({ success: true });
  });

  app.get('/admin/todoitem/add', (c) => {
    const defaultTime = getZoneTimeStr(c.env.TIME_ZONE).replace(' ', 'T');
    return c.html(document(<TodoitemAddPage defaultTime={defaultTime} userName={c.env.USER_NAME} />));
  });

  app.get('/admin/todoitem/edit', async (c) => {
    const id = c.req.query('id') || '';
    const record = await c.env.DB.prepare('SELECT * FROM todoitem WHERE id = ?').bind(id).first<TodoitemModel>();
    if (!record) return c.text('记录不存在');
    return c.html(document(<TodoitemEditPage record={record} userName={c.env.USER_NAME} />));
  });

  app.get('/admin/todoitem/delete-single', async (c) => {
    const id = c.req.query('id') || '';
    await c.env.DB.prepare('DELETE FROM todoitem WHERE id = ?').bind(id).run();
    return c.redirect('/admin/todoitem');
  });

  app.post('/admin/todoitem/save', async (c) => {
    const body = await c.req.parseBody();
    const done = body.done === '1' ? 1 : 0;
    const timeStr = (body.todo_time as string).replace('T', ' ');
    if (body.id) {
      await c.env.DB.prepare('UPDATE todoitem SET title=?, todo_time=?, content=?, done=? WHERE id=?').bind(body.title, timeStr, body.content, done, body.id).run();
    } else {
      await c.env.DB.prepare('INSERT INTO todoitem (title, todo_time, content, done) VALUES (?, ?, ?, ?)').bind(body.title, timeStr, body.content, done).run();
    }
    return c.redirect('/admin/todoitem');
  });

  app.post('/admin/todoitem/delete-selected', async (c) => {
    const body = await c.req.parseBody();
    const formData = await c.req.formData();
    const ids = formData.getAll('selected_ids');
    if (body.action === 'delete' && ids.length > 0) {
      for (const id of ids) {
        await c.env.DB.prepare('DELETE FROM todoitem WHERE id = ?').bind(id).run();
      }
    }
    const status = formData.get('status') || 'pending';
    return c.redirect(`/admin/todoitem?status=${status}`);
  });
}
