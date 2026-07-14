export async function encryptPswd(text: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  // 确保秘钥对齐到合适长度
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret.padEnd(32, '0').substring(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, keyMaterial, enc.encode(text));
  const cipherHex = Array.from(new Uint8Array(cipher)).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${ivHex}:${cipherHex}`;
}

export async function decryptPswd(cipherText: string, secret: string): Promise<string> {
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 2) return cipherText;
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret.padEnd(32, '0').substring(0, 32)),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const iv = new Uint8Array(parts[0].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const cipher = new Uint8Array(parts[1].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, keyMaterial, cipher);
    return new TextDecoder().decode(decrypted);
  } catch {
    return cipherText;
  }
}

export function getZoneTimeStr(timeZone: string, dateObj: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(dateObj);
  const map: Record<string, string> = {};
  parts.forEach(p => { map[p.type] = p.value; });
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}
