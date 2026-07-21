import { D1Database } from '@cloudflare/workers-types';

// 生成 10 天后的毫秒时间戳
const getTenDaysLater = () => Date.now() + 10 * 24 * 60 * 60 * 1000;

/**
 * 1. 生成安全随机的 base64url 编码的 Cookie ID 并存入数据库
 */
export async function createCookie(db: D1Database): Promise<string> {
  // 生成 24 字节的随机数 (相当于 crypto.randomBytes(24))
  const rawBytes = new Uint8Array(24);
  crypto.getRandomValues(rawBytes);
  
  // 转换为 base64url 格式
  const base64url = btoa(String.fromCodePoint(...rawBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const expireTime = getTenDaysLater();

  // 写入数据库
  await db.prepare("INSERT INTO cookie (id, et) VALUES (?, ?)").bind(base64url, expireTime).run();

  return base64url;
}

/**
 * 2. 校验 Cookie 是否合法，若合法则续期 10 天
 */
export async function verifyCookie(db: D1Database, cookieId: string | undefined): Promise<boolean> {
  if (!cookieId) return false;

  // 查询数据库中的记录
  const record = await db.prepare("SELECT et FROM cookie WHERE id = ?").bind(cookieId).first<{ et: number }>();

  if (!record) return false;

  // 检查是否过期
  if (Date.now() > record.et) {
    // 异步清理已过期的记录，不阻塞主流程
    await db.prepare("DELETE FROM cookie WHERE id = ?").bind(cookieId).run();
    return false;
  }

  // 仍然合法，为其续期 10 天
  if (record.et - Date.now() < 2 * 24 * 60 * 60 * 1000) {
    const newExpireTime = getTenDaysLater();
    await db.prepare("UPDATE cookie SET et = ? WHERE id = ?").bind(newExpireTime, cookieId).run();
  }

  return true;
}

/**
 * 3. 删除 Cookie 记录
 */
export async function deleteCookieRecord(db: D1Database, cookieId: string | undefined): Promise<void> {
  if (!cookieId) return;
  await db.prepare("DELETE FROM cookie WHERE id = ? OR et < ?").bind(cookieId, Date.now()).run();
}