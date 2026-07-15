import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { createCookie, verifyCookie, deleteCookieRecord } from './auth';
import { Env, PasswordModel, BookmarkModel, NotebookModel, TodoitemModel } from './types';
import { encryptPswd, decryptPswd, getZoneTimeStr } from './utils';
import * as tpl from './templates';

const app = new Hono<{ Bindings: Env }>();

// 1. 最先：静态资源处理（最高优先级）
app.use('*', async (c, next) => {
  const response = await c.env.ASSETS?.fetch(c.req.raw)
  if (response && response.status !== 404) {
    return response
  }
  await next()
})

const authMiddleware = async (c: any, next: any) => {
  const session = getCookie(c, 'admin_session');
  // 调用动态校验函数
  const isValid = await verifyCookie(c.env.DB, session);
  if (isValid) {
    await next();
  } else {
    if (c.req.path.startsWith('/admin')) {
      if (c.req.path === '/admin/login') return await next();
      return c.html(tpl.loginPage());
    }
    return c.html(tpl.loginPage());
  }
};

app.use('*', async (c, next) => {
  if (c.req.path === '/admin/login' || c.req.path === '/favicon.ico') {
    return await next();
  }
  return await authMiddleware(c, next);
});

app.get('/', async (c) => {
  const bookmarks = await c.env.DB.prepare("SELECT * FROM bookmark WHERE show = 1 ORDER BY name ASC").all<BookmarkModel>();
  const nowStr = getZoneTimeStr(c.env.TIME_ZONE);
  const recentTodos = await c.env.DB.prepare(
    "SELECT * FROM todoitem WHERE done = 0 AND todo_time >= ? ORDER BY todo_time ASC LIMIT 10"
  ).bind(nowStr).all<TodoitemModel>();

  return c.html(tpl.indexPage(bookmarks.results || [], recentTodos.results || [], c.env.USER_NAME));
});

app.post('/admin/login', async (c) => {
  const body = await c.req.parseBody();
  if (body.username === c.env.USER_NAME && body.password === c.env.USER_PSWD) {
    // 生成动态安全的 cookie ID
    const sessionToken = await createCookie(c.env.DB);
    // 浏览器端的 maxAge 也可以设为 10 天（864000 秒），保持一致
    setCookie(c, 'admin_session', sessionToken, { maxAge: 864000, path: '/', httpOnly: true, sameSite: 'Strict' });
    return c.redirect('/admin');
  }
  return c.html(tpl.loginPage('无效的平台管理凭证，请重试'));
});

app.get('/admin/logout', async (c) => {
  const session = getCookie(c, 'admin_session');
  // 数据库中删除
  await deleteCookieRecord(c.env.DB, session);
  // 浏览器端删除
  deleteCookie(c, 'admin_session', { path: '/' });
  return c.redirect('/');
});

app.get('/admin', (c) => c.html(tpl.dashboardPage(c.env.USER_NAME)));

/* 1. PASSWORD (密码模块) */
app.get('/admin/password', async (c) => {
  const q = c.req.query('q') || '';
  let query = "SELECT * FROM password";
  let params: any[] = [];
  if (q) {
    query += " WHERE note LIKE ? OR name LIKE ? OR urls LIKE ? OR info LIKE ?";
    const like = `%${q}%`;
    params = [like, like, like, like];
  }
  query += " ORDER BY note ASC";
  const res = await c.env.DB.prepare(query).bind(...params).all<PasswordModel>();
  
  const headers = ['备注', '账户', '密码', '域名'];
  const rows = await Promise.all((res.results || []).map(async (r) => {
    const plainPswd = await decryptPswd(r.pswd, c.env.AES_KEY);
    const links = r.urls.split('\n').map(line => {
      const clean = line.trim();
      if(!clean) return '';
      const prefix = (clean.includes('localhost') || clean.includes('127.0.0.1')) ? 'http://' : 'https://';
      return `<a href="${prefix}${clean}" target="_blank" style="color:#447e9b;">${clean}</a>`;
    }).join(' | ');
    return [r.note, r.name, plainPswd, links];
  }));

  const extra = `
    <a href="/admin/password/export" class="btn btn-sec" style="font-size:12px;">导出 CSV</a>
    <button type="button" class="btn btn-sec" style="font-size:12px;" onclick="document.getElementById('csv_file').click()">导入 CSV</button>
    <form id="csv_form" action="/admin/password/import" method="POST" enctype="multipart/form-data" style="display:none;">
       <input type="file" id="csv_file" name="csv" onchange="document.getElementById('csv_form').submit()">
    </form>
  `;

  return c.html(tpl.listPage('password', '密码', headers, rows, q, extra, '', c.env.USER_NAME));
});

app.get('/admin/password/add', (c) => {
  const fields = `
    <div class="form-row"><label>备注:</label><input type="text" name="note" placeholder="主键" required></div>
    <div class="form-row"><label>账户:</label><input type="text" name="name" required></div>
    <div class="form-row"><label>密码:</label><input type="text" name="pswd" required></div>
    <div class="form-row"><label>域名:</label><textarea name="urls" rows="5" placeholder="google.com&#10;google.cn"></textarea></div>
    <div class="form-row"><label>信息:</label><textarea name="info" rows="10"></textarea></div>
  `;
  return c.html(tpl.formPage('password', '密码', false, fields, '', c.env.USER_NAME));
});

app.get('/admin/password/edit', async (c) => {
  const note = c.req.query('id') || '';
  const r = await c.env.DB.prepare("SELECT * FROM password WHERE note = ?").bind(note).first<PasswordModel>();
  if (!r) return c.text('记录不存在');
  const plainPswd = await decryptPswd(r.pswd, c.env.AES_KEY);
  const fields = `
    <div class="form-row"><label>备注:</label><input type="text" name="note" value="${r.note}" readonly style="background:#eee; "></div>
    <div class="form-row"><label>账户:</label><input type="text" name="name" value="${r.name}" required></div>
    <div class="form-row"><label>密码:</label><input type="text" name="pswd" value="${plainPswd}" required></div>
    <div class="form-row"><label>域名:</label><textarea name="urls" rows="5" placeholder="google.com&#10;google.cn">${r.urls}</textarea></div>
    <div class="form-row"><label>信息:</label><textarea name="info" rows="10">${r.info || ''}</textarea></div>
  `;
  const deleteUrl = `/admin/password/delete-single?id=${encodeURIComponent(r.note)}`;
  return c.html(tpl.formPage('password', '密码', true, fields, '', c.env.USER_NAME, deleteUrl));
});

app.get('/admin/password/delete-single', async (c) => {
  const id = c.req.query('id') || '';
  await c.env.DB.prepare("DELETE FROM password WHERE note = ?").bind(id).run();
  return c.redirect('/admin/password');
});

app.post('/admin/password/save', async (c) => {
  const body = await c.req.parseBody();
  const encrypted = await encryptPswd(body.pswd as string, c.env.AES_KEY);
  await c.env.DB.prepare(
    "INSERT INTO password (note, name, pswd, urls, info) VALUES (?, ?, ?, ?, ?) ON CONFLICT(note) DO UPDATE SET name=excluded.name, pswd=excluded.pswd, urls=excluded.urls, info=excluded.info"
  ).bind(body.note, body.name, encrypted, body.urls, body.info).run();
  return c.redirect('/admin/password');
});

app.post('/admin/password/delete-selected', async (c) => {
  const body = await c.req.parseBody();
  const formData = await c.req.formData();
  const ids = formData.getAll('selected_ids');
  if (body.action === 'delete' && ids.length > 0) {
    for (const id of ids) {
      await c.env.DB.prepare("DELETE FROM password WHERE note = ?").bind(id).run();
    }
  }
  return c.redirect('/admin/password');
});

app.get('/admin/password/export', async (c) => {
  const res = await c.env.DB.prepare("SELECT * FROM password ORDER BY note ASC").all<PasswordModel>();
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
      const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
      csvContent += `${escape(cleanLine)},${escape(fullUrl)},${escape(row.name)},${escape(plainPswd)},${escape(row.note)}\n`;
    }
  }
  return new Response(csvContent, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="password.csv"' }
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
    const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (parts.length >= 5) {
      const clean = (s: string) => s.replace(/^"|"$/g, '').replace(/""/g, '"');
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
          info = COALESCE(excluded.info, info),           -- 保留原有 info，除非新导入的有值
          urls = CASE 
            WHEN urls IS NULL OR TRIM(urls) = '' 
              THEN TRIM(excluded.urls)
            
            -- 关键：按行判断是否已经存在
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

/* 2. BOOKMARK (书签模块) */
app.get('/admin/bookmark', async (c) => {
  const q = c.req.query('q') || '';
  let query = "SELECT * FROM bookmark";
  let params: any[] = [];
  if (q) {
    query += " WHERE name LIKE ? OR url LIKE ?";
    params = [`%${q}%`, `%${q}%`];
  }
  query += " ORDER BY name ASC";
  const res = await c.env.DB.prepare(query).bind(...params).all<BookmarkModel>();
  
  const headers = ['ID', '站名', '显示'];
  const rows = (res.results || []).map(r => [
    r.id.toString(),
    `<a href="${r.url}" target="_blank" style="color:#447e9b;">${r.name}</a>`,
    `<input type="checkbox" ${r.show === 1 ? 'checked' : ''} onchange="toggleStatus('bookmark', ${r.id}, this)">`
  ]);

  const extra = `
    <a href="/admin/bookmark/export" class="btn btn-sec" style="font-size:12px;">导出 HTML</a>
    <button type="button" class="btn btn-sec" style="font-size:12px;" onclick="document.getElementById('html_file').click()">导入 HTML</button>
    <form id="html_form" action="/admin/bookmark/import" method="POST" enctype="multipart/form-data" style="display:none;">
       <input type="file" id="html_file" name="html" onchange="document.getElementById('html_form').submit()">
    </form>
  `;

  return c.html(tpl.listPage('bookmark', '书签', headers, rows, q, extra, '', c.env.USER_NAME));
});

app.post('/admin/bookmark/toggle-field', async (c) => {
  const body = await c.req.json();
  const showVal = body.checked ? 1 : 0;
  await c.env.DB.prepare("UPDATE bookmark SET show = ? WHERE id = ?").bind(showVal, body.id).run();
  return c.json({ success: true });
});

app.get('/admin/bookmark/export', async (c) => {
  const res = await c.env.DB.prepare("SELECT * FROM bookmark ORDER BY name ASC").all<BookmarkModel>();
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n`;
  (res.results || []).forEach(r => {
    html += `    <DT><A HREF="${r.url}">${r.name}</A>\n`;
  });
  html += `</DL><p>\n`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': 'attachment; filename="bookmarks.html"' }
  });
});

app.get('/admin/bookmark/add', (c) => {
  const fields = `
    <div class="form-row"><label>站名:</label><input type="text" name="name" required></div>
    <div class="form-row"><label>网址:</label><input type="text" name="url" required placeholder="https://"></div>
    <div class="form-row"><label>显示:</label><input type="checkbox" name="show" value="1"></div>
  `;
  return c.html(tpl.formPage('bookmark', '书签', false, fields, '', c.env.USER_NAME));
});

app.get('/admin/bookmark/edit', async (c) => {
  const id = c.req.query('id') || '';
  const r = await c.env.DB.prepare("SELECT * FROM bookmark WHERE id = ?").bind(id).first<BookmarkModel>();
  if (!r) return c.text('记录不存在');
  const fields = `
    <div class="form-row"><label>站名:</label><input type="text" name="name" value="${r.name}" required></div>
    <div class="form-row"><label>网址:</label><input type="text" name="url" value="${r.url}" required></div>
    <div class="form-row"><label>显示:</label><input type="checkbox" name="show" value="1" ${r.show === 1 ? 'checked' : ''}></div>
  `;
  const deleteUrl = `/admin/bookmark/delete-single?id=${r.id}`;
  return c.html(tpl.formPage('bookmark', '书签', true, fields, `<input type="hidden" name="id" value="${r.id}">`, c.env.USER_NAME, deleteUrl));
});

app.get('/admin/bookmark/delete-single', async (c) => {
  const id = c.req.query('id') || '';
  await c.env.DB.prepare("DELETE FROM bookmark WHERE id = ?").bind(id).run();
  return c.redirect('/admin/bookmark');
});

app.post('/admin/bookmark/save', async (c) => {
  const body = await c.req.parseBody();
  const show = body.show === '1' ? 1 : 0;
  if (body.id) {
    await c.env.DB.prepare("UPDATE bookmark SET name=?, url=?, show=? WHERE id=?").bind(body.name, body.url, show, body.id).run();
  } else {
    await c.env.DB.prepare("INSERT INTO bookmark (name, url, show) VALUES (?, ?, ?)").bind(body.name, body.url, show).run();
  }
  return c.redirect('/admin/bookmark');
});

app.post('/admin/bookmark/delete-selected', async (c) => {
  const body = await c.req.parseBody();
  const formData = await c.req.formData();
  const ids = formData.getAll('selected_ids');
  if (body.action === 'delete' && ids.length > 0) {
    for (const id of ids) {
      await c.env.DB.prepare("DELETE FROM bookmark WHERE id = ?").bind(id).run();
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
    const exist = await c.env.DB.prepare("SELECT id FROM bookmark WHERE url = ?").bind(url).first<BookmarkModel>();
    if (exist) {
      await c.env.DB.prepare("UPDATE bookmark SET name = ? WHERE id = ?").bind(name, exist.id).run();
    } else {
      await c.env.DB.prepare("INSERT INTO bookmark (name, url, show) VALUES (?, ?, 0)").bind(name, url).run();
    }
  }
  return c.redirect('/admin/bookmark');
});

/* 3. NOTEBOOK (笔记模块) */
app.get('/admin/notebook', async (c) => {
  const q = c.req.query('q') || '';
  let query = "SELECT * FROM notebook";
  let params: any[] = [];
  if (q) {
    query += " WHERE title LIKE ? OR content LIKE ?";
    params = [`%${q}%`, `%${q}%`];
  }
  query += " ORDER BY create_time DESC";
  const res = await c.env.DB.prepare(query).bind(...params).all<NotebookModel>();
  
  const headers = ['ID', '标题', '内容', '时间'];
  const rows = (res.results || []).map(r => [
    r.id.toString(),
    r.title,
    r.content.length > 50 ? r.content.substring(0, 50) + '...' : r.content,
    r.create_time
  ]);
  return c.html(tpl.listPage('notebook', '笔记', headers, rows, q, '', '', c.env.USER_NAME));
});

app.get('/admin/notebook/add', (c) => {
  const fields = `
    <div class="form-row"><label>标题:</label><input type="text" name="title" required></div>
    <div class="form-row"><label>内容:</label><textarea name="content" rows="20" required></textarea></div>
  `;
  return c.html(tpl.formPage('notebook', '笔记', false, fields, '', c.env.USER_NAME));
});

app.get('/admin/notebook/edit', async (c) => {
  const id = c.req.query('id') || '';
  const r = await c.env.DB.prepare("SELECT * FROM notebook WHERE id = ?").bind(id).first<NotebookModel>();
  if (!r) return c.text('记录不存在');
  const fields = `
    <div class="form-row"><label>标题:</label><input type="text" name="title" value="${r.title}" required></div>
    <div class="form-row"><label>内容:</label><textarea name="content" rows="20" required>${r.content}</textarea></div>
  `;
  const deleteUrl = `/admin/notebook/delete-single?id=${r.id}`;
  return c.html(tpl.formPage('notebook', '笔记', true, fields, `<input type="hidden" name="id" value="${r.id}"><input type="hidden" name="create_time" value="${r.create_time}">`, c.env.USER_NAME, deleteUrl));
});

app.get('/admin/notebook/delete-single', async (c) => {
  const id = c.req.query('id') || '';
  await c.env.DB.prepare("DELETE FROM notebook WHERE id = ?").bind(id).run();
  return c.redirect('/admin/notebook');
});

app.post('/admin/notebook/save', async (c) => {
  const body = await c.req.parseBody();
  const timeStr = (body.create_time as string) || getZoneTimeStr(c.env.TIME_ZONE);
  if (body.id) {
    await c.env.DB.prepare("UPDATE notebook SET title=?, content=?, create_time=? WHERE id=?").bind(body.title, body.content, timeStr, body.id).run();
  } else {
    await c.env.DB.prepare("INSERT INTO notebook (title, content, create_time) VALUES (?, ?, ?)").bind(body.title, body.content, timeStr).run();
  }
  return c.redirect('/admin/notebook');
});

app.post('/admin/notebook/delete-selected', async (c) => {
  const body = await c.req.parseBody();
  const formData = await c.req.formData();
  const ids = formData.getAll('selected_ids');
  if (body.action === 'delete' && ids.length > 0) {
    for (const id of ids) {
      await c.env.DB.prepare("DELETE FROM notebook WHERE id = ?").bind(id).run();
    }
  }
  return c.redirect('/admin/notebook');
});

/* 4. TODOITEM (待办模块) */
app.get('/admin/todoitem', async (c) => {
  const q = c.req.query('q') || '';
  const status = c.req.query('status') || 'pending';
  const nowStr = getZoneTimeStr(c.env.TIME_ZONE);
  
  let query = "SELECT * FROM todoitem WHERE 1=1";
  let params: any[] = [];
  
  if (status === 'pending') {
    query += " AND done = 0 AND todo_time >= ?";
    params.push(nowStr);
  } else if (status === 'completed') {
    query += " AND done = 1";
  } else if (status === 'expired') {
    query += " AND done = 0 AND todo_time < ?";
    params.push(nowStr);
  }

  if (q) {
    query += " AND (title LIKE ? OR content LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  if (status === 'pending' || status === 'completed') {
    query += " ORDER BY todo_time ASC";
  } else {
    query += " ORDER BY todo_time DESC";
  }

  const res = await c.env.DB.prepare(query).bind(...params).all<TodoitemModel>();
  
  const filterWidget = `
    <div style="margin-bottom: 15px; background: #fff; padding: 10px 15px; border: 1px solid #e8e8e8; border-radius: 4px; font-size: 13px;">
       状态筛选：
       <a href="/admin/todoitem?status=pending&q=${q}" style="margin-right:15px; text-decoration:none; font-weight:${status === 'pending' ? 'bold;color:#417690;' : 'normal;color:#666;'}">待办理</a>
       <a href="/admin/todoitem?status=completed&q=${q}" style="margin-right:15px; text-decoration:none; font-weight:${status === 'completed' ? 'bold;color:#417690;' : 'normal;color:#666;'}">已完成</a>
       <a href="/admin/todoitem?status=expired&q=${q}" style="text-decoration:none; font-weight:${status === 'expired' ? 'bold;color:#417690;' : 'normal;color:#666;'}">已过期</a>
    </div>
  `;

  const headers = ['ID', '标题', '时间', '状态', '完成'];
  const rows = (res.results || []).map(r => {
    let stateLabel = '';
    if (r.done === 1) stateLabel = '<span style="color:green;">已完成</span>';
    else if (r.todo_time < nowStr) stateLabel = '<span style="color:#ba2121;font-weight:bold;">已过期</span>';
    else stateLabel = '<span style="color:orange;">进行中</span>';

    return [
      r.id.toString(),
      r.title,
      r.todo_time,
      stateLabel,
      `<input type="checkbox" ${r.done === 1 ? 'checked' : ''} onchange="toggleStatus('todoitem', ${r.id}, this)">`
    ];
  });

  return c.html(tpl.listPage('todoitem', '待办', headers, rows, q, '', filterWidget, c.env.USER_NAME, status));
});

app.post('/admin/todoitem/toggle-field', async (c) => {
  const body = await c.req.json();
  const doneVal = body.checked ? 1 : 0;
  await c.env.DB.prepare("UPDATE todoitem SET done = ? WHERE id = ?").bind(doneVal, body.id).run();
  return c.json({ success: true });
});

app.get('/admin/todoitem/add', (c) => {
  // datetime-local 组件需要以 T 拼接日期与时间
  const defaultTime = getZoneTimeStr(c.env.TIME_ZONE).replace(' ', 'T');
  const fields = `
    <div class="form-row"><label>标题:</label><input type="text" name="title" required></div>
    <div class="form-row"><label>时间:</label><input type="datetime-local" step="1" name="todo_time" required value="${defaultTime}"></div>
    <div class="form-row"><label>详情:</label><textarea name="content" rows="10"></textarea></div>
    <div class="form-row"><label>完成:</label><input type="checkbox" name="done" value="1"></div>
  `;
  return c.html(tpl.formPage('todoitem', '待办', false, fields, '', c.env.USER_NAME));
});

app.get('/admin/todoitem/edit', async (c) => {
  const id = c.req.query('id') || '';
  const r = await c.env.DB.prepare("SELECT * FROM todoitem WHERE id = ?").bind(id).first<TodoitemModel>();
  if (!r) return c.text('记录不存在');
  const defaultTime = r.todo_time.replace(' ', 'T');
  const fields = `
    <div class="form-row"><label>标题:</label><input type="text" name="title" value="${r.title}" required></div>
    <div class="form-row"><label>时间:</label><input type="datetime-local" step="1" name="todo_time" value="${defaultTime}" required></div>
    <div class="form-row"><label>详情:</label><textarea name="content" rows="10">${r.content}</textarea></div>
    <div class="form-row"><label>完成:</label><input type="checkbox" name="done" value="1" ${r.done === 1 ? 'checked' : ''}></div>
  `;
  const deleteUrl = `/admin/todoitem/delete-single?id=${r.id}`;
  return c.html(tpl.formPage('todoitem', '待办', true, fields, `<input type="hidden" name="id" value="${r.id}">`, c.env.USER_NAME, deleteUrl));
});

app.get('/admin/todoitem/delete-single', async (c) => {
  const id = c.req.query('id') || '';
  await c.env.DB.prepare("DELETE FROM todoitem WHERE id = ?").bind(id).run();
  return c.redirect('/admin/todoitem');
});

app.post('/admin/todoitem/save', async (c) => {
  const body = await c.req.parseBody();
  const done = body.done === '1' ? 1 : 0;
  // 替换回来，还原为系统内统一的标准空格时间戳，确保多态过滤正确
  const timeStr = (body.todo_time as string).replace('T', ' ');
  if (body.id) {
    await c.env.DB.prepare("UPDATE todoitem SET title=?, todo_time=?, content=?, done=? WHERE id=?").bind(body.title, timeStr, body.content, done, body.id).run();
  } else {
    await c.env.DB.prepare("INSERT INTO todoitem (title, todo_time, content, done) VALUES (?, ?, ?, ?)").bind(body.title, timeStr, body.content, done).run();
  }
  return c.redirect('/admin/todoitem');
});

app.post('/admin/todoitem/delete-selected', async (c) => {
  const body = await c.req.parseBody();
  const formData = await c.req.formData();
  const ids = formData.getAll('selected_ids');
  if (body.action === 'delete' && ids.length > 0) {
    for (const id of ids) {
      await c.env.DB.prepare("DELETE FROM todoitem WHERE id = ?").bind(id).run();
    }
  }
  const status = formData.get('status') || 'pending';
  return c.redirect(`/admin/todoitem?status=${status}`);
});

export default app;
