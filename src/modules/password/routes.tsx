import { document } from '../../components/render';
import type { App } from '../../types';
import { decryptPswd, encryptPswd } from '../../utils';
import type { PasswordModel } from './types';
import { PasswordAddPage, PasswordEditPage, PasswordListPage } from './views';

export function registerPasswordModule(app: App): void {
  app.get('/admin/password', async (c) => {
    const q = c.req.query('q') || '';
    let query = 'SELECT * FROM password';
    let params: any[] = [];
    if (q) {
      query += ' WHERE note LIKE ? OR name LIKE ? OR urls LIKE ? OR info LIKE ?';
      const like = `%${q}%`;
      params = [like, like, like, like];
    }
    query += ' ORDER BY note ASC';
    const res = await c.env.DB.prepare(query).bind(...params).all<PasswordModel>();

    const rows = await Promise.all((res.results || []).map(async (record) => {
      const plainPswd = await decryptPswd(record.pswd, c.env.AES_KEY);
      const links = record.urls.split('\n').map((line) => {
        const clean = line.trim();
        if (!clean) return '';
        const prefix = (clean.includes('localhost') || clean.includes('127.0.0.1')) ? 'http://' : 'https://';
        return `<a href="${prefix}${clean}" target="_blank" class="external-link">${clean}</a>`;
      }).join(' | ');
      return [record.note, record.name, plainPswd, links];
    }));

    return c.html(document(<PasswordListPage rows={rows} searchVal={q} userName={c.env.USER_NAME} />));
  });

  app.get('/admin/password/add', (c) => c.html(document(<PasswordAddPage userName={c.env.USER_NAME} />)));

  app.get('/admin/password/edit', async (c) => {
    const note = c.req.query('id') || '';
    const record = await c.env.DB.prepare('SELECT * FROM password WHERE note = ?').bind(note).first<PasswordModel>();
    if (!record) return c.text('记录不存在');
    const plainPassword = await decryptPswd(record.pswd, c.env.AES_KEY);
    return c.html(document(<PasswordEditPage record={record} plainPassword={plainPassword} userName={c.env.USER_NAME} />));
  });

  app.get('/admin/password/delete-single', async (c) => {
    const id = c.req.query('id') || '';
    await c.env.DB.prepare('DELETE FROM password WHERE note = ?').bind(id).run();
    return c.redirect('/admin/password');
  });

  app.post('/admin/password/save', async (c) => {
    const body = await c.req.parseBody();
    const encrypted = await encryptPswd(body.pswd as string, c.env.AES_KEY);
    await c.env.DB.prepare(
      'INSERT INTO password (note, name, pswd, urls, info) VALUES (?, ?, ?, ?, ?) ON CONFLICT(note) DO UPDATE SET name=excluded.name, pswd=excluded.pswd, urls=excluded.urls, info=excluded.info',
    ).bind(body.note, body.name, encrypted, body.urls, body.info).run();
    return c.redirect('/admin/password');
  });

  app.post('/admin/password/delete-selected', async (c) => {
    const body = await c.req.parseBody();
    const formData = await c.req.formData();
    const ids = formData.getAll('selected_ids');
    if (body.action === 'delete' && ids.length > 0) {
      for (const id of ids) {
        await c.env.DB.prepare('DELETE FROM password WHERE note = ?').bind(id).run();
      }
    }
    return c.redirect('/admin/password');
  });

  app.get('/admin/password/export', async (c) => {
    const res = await c.env.DB.prepare('SELECT * FROM password ORDER BY note ASC').all<PasswordModel>();
    let csvContent = 'name,url,username,password,note\n';

    for (const row of res.results || []) {
      const lines = row.urls.split('\n');
      const plainPswd = await decryptPswd(row.pswd, c.env.AES_KEY);
      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;
        const isHttp = cleanLine.includes('localhost') || cleanLine.includes('127.0.0.1');
        const prefix = isHttp ? 'http' : 'https';
        const fullUrl = `${prefix}://${cleanLine}`;
        const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
        csvContent += `${escape(cleanLine)},${escape(fullUrl)},${escape(row.name)},${escape(plainPswd)},${escape(row.note)}\n`;
      }
    }
    return new Response(csvContent, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="password.csv"' },
    });
  });

  app.post('/admin/password/import', async (c) => {
    const body = await c.req.parseBody();
    const file = body.csv as File;
    if (!file) return c.text('没有检测到上传文件');
    const text = await file.text();
    const lines = text.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/);
      if (parts.length >= 5) {
        const clean = (value: string) => value.replace(/^\"|\"$/g, '').replace(/\"\"/g, '"');
        const urlDomain = clean(parts[0]);
        const username = clean(parts[2]);
        const plainPswd = clean(parts[3]);
        const note = clean(parts[4]);
        if (!note) continue;
        const encrypted = await encryptPswd(plainPswd, c.env.AES_KEY);
        await c.env.DB.prepare(`
          INSERT INTO password (note, name, pswd, urls, info)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(note) DO UPDATE SET
            name = excluded.name,
            pswd = excluded.pswd,
            info = COALESCE(excluded.info, info),
            urls = CASE
              WHEN urls IS NULL OR TRIM(urls) = ''
                THEN TRIM(excluded.urls)
              WHEN (
                '\n' || urls || '\n' LIKE '%\n' || excluded.urls || '\n%'
                OR urls = excluded.urls
              )
                THEN urls
              ELSE TRIM(urls || '\n' || excluded.urls)
            END
        `).bind(note, username, encrypted, urlDomain, 'Imported from CSV').run();
      }
    }
    return c.redirect('/admin/password');
  });
}
