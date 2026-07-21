import { document } from '../../components/render';
import type { App } from '../../types';
import type { BookmarkModel } from './types';
import { BookmarkAddPage, BookmarkEditPage, BookmarkListPage } from './views';

export function registerBookmarkModule(app: App): void {
  app.get('/admin/bookmark', async (c) => {
    const q = c.req.query('q') || '';
    let query = 'SELECT * FROM bookmark';
    let params: any[] = [];
    if (q) {
      query += ' WHERE name LIKE ? OR url LIKE ?';
      params = [`%${q}%`, `%${q}%`];
    }
    query += ' ORDER BY name ASC';
    const res = await c.env.DB.prepare(query).bind(...params).all<BookmarkModel>();
    const rows = (res.results || []).map((record) => [
      record.id.toString(),
      `<a href="${record.url}" target="_blank" class="external-link">${record.name}</a>`,
      `<input type="checkbox" ${record.show === 1 ? 'checked' : ''} data-toggle-endpoint="bookmark" data-record-id="${record.id}">`,
    ]);
    return c.html(document(<BookmarkListPage rows={rows} searchVal={q} userName={c.env.USER_NAME} />));
  });

  app.post('/admin/bookmark/toggle-field', async (c) => {
    const body = await c.req.json();
    const showVal = body.checked ? 1 : 0;
    await c.env.DB.prepare('UPDATE bookmark SET show = ? WHERE id = ?').bind(showVal, body.id).run();
    return c.json({ success: true });
  });

  app.get('/admin/bookmark/export', async (c) => {
    const res = await c.env.DB.prepare('SELECT * FROM bookmark ORDER BY name ASC').all<BookmarkModel>();
    let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n';
    (res.results || []).forEach((record) => {
      html += `    <DT><A HREF="${record.url}">${record.name}</A>\n`;
    });
    html += '</DL><p>\n';
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': 'attachment; filename="bookmarks.html"' },
    });
  });

  app.get('/admin/bookmark/add', (c) => c.html(document(<BookmarkAddPage userName={c.env.USER_NAME} />)));

  app.get('/admin/bookmark/edit', async (c) => {
    const id = c.req.query('id') || '';
    const record = await c.env.DB.prepare('SELECT * FROM bookmark WHERE id = ?').bind(id).first<BookmarkModel>();
    if (!record) return c.text('记录不存在');
    return c.html(document(<BookmarkEditPage record={record} userName={c.env.USER_NAME} />));
  });

  app.get('/admin/bookmark/delete-single', async (c) => {
    const id = c.req.query('id') || '';
    await c.env.DB.prepare('DELETE FROM bookmark WHERE id = ?').bind(id).run();
    return c.redirect('/admin/bookmark');
  });

  app.post('/admin/bookmark/save', async (c) => {
    const body = await c.req.parseBody();
    const show = body.show === '1' ? 1 : 0;
    if (body.id) {
      await c.env.DB.prepare('UPDATE bookmark SET name=?, url=?, show=? WHERE id=?').bind(body.name, body.url, show, body.id).run();
    } else {
      await c.env.DB.prepare('INSERT INTO bookmark (name, url, show) VALUES (?, ?, ?)').bind(body.name, body.url, show).run();
    }
    return c.redirect('/admin/bookmark');
  });

  app.post('/admin/bookmark/delete-selected', async (c) => {
    const body = await c.req.parseBody();
    const formData = await c.req.formData();
    const ids = formData.getAll('selected_ids');
    if (body.action === 'delete' && ids.length > 0) {
      for (const id of ids) {
        await c.env.DB.prepare('DELETE FROM bookmark WHERE id = ?').bind(id).run();
      }
    }
    return c.redirect('/admin/bookmark');
  });

  app.post('/admin/bookmark/import', async (c) => {
    const body = await c.req.parseBody();
    const file = body.html as File;
    if (!file) return c.text('无效的书签文件');
    const text = await file.text();
    const regex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const url = match[1].trim();
      const name = match[2].trim() || url;
      const exist = await c.env.DB.prepare('SELECT id FROM bookmark WHERE url = ?').bind(url).first<BookmarkModel>();
      if (exist) {
        await c.env.DB.prepare('UPDATE bookmark SET name = ? WHERE id = ?').bind(name, exist.id).run();
      } else {
        await c.env.DB.prepare('INSERT INTO bookmark (name, url, show) VALUES (?, ?, 0)').bind(name, url).run();
      }
    }
    return c.redirect('/admin/bookmark');
  });
}
