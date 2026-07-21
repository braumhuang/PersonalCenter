import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { document } from '../../components/render';
import type { App } from '../../types';
import { getZoneTimeStr } from '../../utils';
import type { BookmarkModel } from '../bookmark/types';
import type { TodoitemModel } from '../todoitem/types';
import { createPersonalCenterBackup, importPersonalCenterBackup } from './backup-service';
import { MAX_BACKUP_FILE_SIZE, validateBackup } from './backup-schema';
import { createCookie, deleteCookieRecord, verifyCookie } from './session';
import { DashboardPage, HomePage, LoginPage } from './views';

export function registerWebsiteModule(app: App): void {
  app.use('*', async (c, next) => {
    if (c.req.path === '/admin/login' || c.req.path === '/favicon.ico') {
      return next();
    }

    const session = getCookie(c, 'admin_session');
    const isValid = await verifyCookie(c.env.DB, session);
    if (isValid) return next();
    return c.html(document(<LoginPage />));
  });

  app.get('/', async (c) => {
    const bookmarks = await c.env.DB.prepare('SELECT * FROM bookmark WHERE show = 1 ORDER BY name ASC').all<BookmarkModel>();
    const nowStr = getZoneTimeStr(c.env.TIME_ZONE);
    const recentTodoitems = await c.env.DB.prepare(
      'SELECT * FROM todoitem WHERE done = 0 AND todo_time >= ? ORDER BY todo_time ASC LIMIT 10',
    ).bind(nowStr).all<TodoitemModel>();

    return c.html(document(<HomePage bookmarks={bookmarks.results || []} todoitems={recentTodoitems.results || []} userName={c.env.USER_NAME} />));
  });

  app.post('/admin/login', async (c) => {
    const body = await c.req.parseBody();
    if (body.username === c.env.USER_NAME && body.password === c.env.USER_PSWD) {
      const sessionToken = await createCookie(c.env.DB);
      setCookie(c, 'admin_session', sessionToken, { maxAge: 864000, path: '/', httpOnly: true, sameSite: 'Strict' });
      return c.redirect('/admin');
    }
    return c.html(document(<LoginPage error="无效的平台管理凭证，请重试" />));
  });

  app.get('/admin/logout', async (c) => {
    const session = getCookie(c, 'admin_session');
    await deleteCookieRecord(c.env.DB, session);
    deleteCookie(c, 'admin_session', { path: '/' });
    return c.redirect('/');
  });

  app.get('/admin', (c) => c.html(document(<DashboardPage userName={c.env.USER_NAME} />)));

  app.get('/admin/data/export', async (c) => {
    const backup = await createPersonalCenterBackup(c.env.DB, c.env.AES_KEY);
    const filenameTime = getZoneTimeStr(c.env.TIME_ZONE).replace(/[-: ]/g, '').slice(0, 14);
    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="personal-center-backup-${filenameTime}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  });

  app.post('/admin/data/import', async (c) => {
    try {
      const body = await c.req.parseBody();
      const file = body.data_file;

      if (!(file instanceof File)) {
        return c.json({ success: false, message: '请选择要导入的 JSON 文件。' }, 400);
      }
      if (!file.name.toLowerCase().endsWith('.json')) {
        return c.json({ success: false, message: '文件扩展名必须是 .json。' }, 400);
      }
      if (file.size <= 0) {
        return c.json({ success: false, message: '导入文件不能为空。' }, 400);
      }
      if (file.size > MAX_BACKUP_FILE_SIZE) {
        return c.json({ success: false, message: '导入文件不能超过 20 MB。' }, 400);
      }

      let rawData: unknown;
      try {
        const text = (await file.text()).replace(/^\uFEFF/, '');
        rawData = JSON.parse(text);
      } catch {
        return c.json({ success: false, message: 'JSON 解析失败，请确认文件内容完整且语法正确。' }, 400);
      }

      const validation = validateBackup(rawData);
      if (!validation.ok) {
        return c.json({
          success: false,
          message: '备份文件格式校验失败。',
          errors: validation.errors,
        }, 400);
      }

      const result = await importPersonalCenterBackup(c.env.DB, c.env.AES_KEY, validation.backup);
      return c.json({
        success: true,
        message: `导入完成，共更新或新增 ${result.total} 条记录。`,
        counts: result.counts,
      });
    } catch (error) {
      console.error('Import personal center backup failed:', error);
      return c.json({
        success: false,
        message: '导入过程中发生数据库错误。由于数据采用分批写入，部分记录可能已更新；修复问题后可安全重试同一文件。',
      }, 500);
    }
  });
}
