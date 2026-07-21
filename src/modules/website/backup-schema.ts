import type { PasswordBackupItem } from '../password/types';
import type { BookmarkBackupItem } from '../bookmark/types';
import type { NotebookBackupItem } from '../notebook/types';
import type { TodoitemBackupItem } from '../todoitem/types';

export const BACKUP_FORMAT = 'personal-center-backup';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_RECORDS_PER_MODULE = 100_000;

export interface PersonalCenterBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exported_at: string;
  data: {
    passwords: PasswordBackupItem[];
    bookmarks: BookmarkBackupItem[];
    notebooks: NotebookBackupItem[];
    todoitems: TodoitemBackupItem[];
  };
}

export type BackupValidationResult =
  | { ok: true; backup: PersonalCenterBackup }
  | { ok: false; errors: string[] };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(
  value: unknown,
  path: string,
  errors: string[],
  options: { required?: boolean; allowEmpty?: boolean } = {},
): string {
  if (typeof value !== 'string') {
    errors.push(`${path} 必须是字符串`);
    return '';
  }
  if (options.required && !options.allowEmpty && value.trim() === '') {
    errors.push(`${path} 不能为空`);
  }
  return value;
}

function readPositiveInteger(value: unknown, path: string, errors: string[]): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    errors.push(`${path} 必须是正整数`);
    return 0;
  }
  return value;
}

function readBoolean(value: unknown, path: string, errors: string[]): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 0) return false;
  if (value === 1) return true;
  errors.push(`${path} 必须是布尔值或 0/1`);
  return false;
}

function readDateTime(value: unknown, path: string, errors: string[]): string {
  const text = readString(value, path, errors, { required: true });
  if (text && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) {
    errors.push(`${path} 必须使用 YYYY-MM-DD HH:mm:ss 格式`);
  }
  return text;
}

function readArray(value: unknown, path: string, errors: string[]): unknown[] {
  if (!Array.isArray(value)) {
    errors.push(`${path} 必须是数组`);
    return [];
  }
  if (value.length > MAX_RECORDS_PER_MODULE) {
    errors.push(`${path} 记录数不能超过 ${MAX_RECORDS_PER_MODULE}`);
    return [];
  }
  return value;
}

function rejectDuplicateKeys(values: Array<string | number>, path: string, errors: string[]): void {
  const seen = new Set<string | number>();
  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`${path} 中存在重复主键：${value}`);
      return;
    }
    seen.add(value);
  }
}

export function validateBackup(value: unknown): BackupValidationResult {
  const errors: string[] = [];

  if (!isObject(value)) {
    return { ok: false, errors: ['JSON 顶层必须是对象'] };
  }

  if (value.format !== BACKUP_FORMAT) {
    errors.push(`format 必须是 ${BACKUP_FORMAT}`);
  }
  if (value.version !== BACKUP_VERSION) {
    errors.push(`version 必须是 ${BACKUP_VERSION}`);
  }

  const exportedAt = readString(value.exported_at, 'exported_at', errors, { required: true });
  if (exportedAt && Number.isNaN(Date.parse(exportedAt))) {
    errors.push('exported_at 必须是有效的 ISO 时间');
  }

  if (!isObject(value.data)) {
    errors.push('data 必须是对象');
    return { ok: false, errors: errors.slice(0, 20) };
  }

  const passwordValues = readArray(value.data.passwords, 'data.passwords', errors);
  const bookmarkValues = readArray(value.data.bookmarks, 'data.bookmarks', errors);
  const notebookValues = readArray(value.data.notebooks, 'data.notebooks', errors);
  const todoitemValues = readArray(value.data.todoitems, 'data.todoitems', errors);

  const passwords: PasswordBackupItem[] = passwordValues.map((item, index) => {
    const path = `data.passwords[${index}]`;
    if (!isObject(item)) {
      errors.push(`${path} 必须是对象`);
      return { note: '', name: '', password: '', urls: '', info: '' };
    }
    return {
      note: readString(item.note, `${path}.note`, errors, { required: true }),
      name: readString(item.name, `${path}.name`, errors, { required: true }),
      password: readString(item.password, `${path}.password`, errors, { allowEmpty: true }),
      urls: readString(item.urls, `${path}.urls`, errors, { allowEmpty: true }),
      info: readString(item.info, `${path}.info`, errors, { allowEmpty: true }),
    };
  });

  const bookmarks: BookmarkBackupItem[] = bookmarkValues.map((item, index) => {
    const path = `data.bookmarks[${index}]`;
    if (!isObject(item)) {
      errors.push(`${path} 必须是对象`);
      return { id: 0, name: '', url: '', show: false };
    }
    return {
      id: readPositiveInteger(item.id, `${path}.id`, errors),
      name: readString(item.name, `${path}.name`, errors, { required: true }),
      url: readString(item.url, `${path}.url`, errors, { required: true }),
      show: readBoolean(item.show, `${path}.show`, errors),
    };
  });

  const notebooks: NotebookBackupItem[] = notebookValues.map((item, index) => {
    const path = `data.notebooks[${index}]`;
    if (!isObject(item)) {
      errors.push(`${path} 必须是对象`);
      return { id: 0, title: '', content: '', create_time: '' };
    }
    return {
      id: readPositiveInteger(item.id, `${path}.id`, errors),
      title: readString(item.title, `${path}.title`, errors, { required: true }),
      content: readString(item.content, `${path}.content`, errors, { allowEmpty: true }),
      create_time: readDateTime(item.create_time, `${path}.create_time`, errors),
    };
  });

  const todoitems: TodoitemBackupItem[] = todoitemValues.map((item, index) => {
    const path = `data.todoitems[${index}]`;
    if (!isObject(item)) {
      errors.push(`${path} 必须是对象`);
      return { id: 0, title: '', content: '', todo_time: '', done: false };
    }
    return {
      id: readPositiveInteger(item.id, `${path}.id`, errors),
      title: readString(item.title, `${path}.title`, errors, { required: true }),
      content: readString(item.content, `${path}.content`, errors, { allowEmpty: true }),
      todo_time: readDateTime(item.todo_time, `${path}.todo_time`, errors),
      done: readBoolean(item.done, `${path}.done`, errors),
    };
  });

  rejectDuplicateKeys(passwords.map((item) => item.note), 'data.passwords', errors);
  rejectDuplicateKeys(bookmarks.map((item) => item.id), 'data.bookmarks', errors);
  rejectDuplicateKeys(notebooks.map((item) => item.id), 'data.notebooks', errors);
  rejectDuplicateKeys(todoitems.map((item) => item.id), 'data.todoitems', errors);

  if (errors.length > 0) {
    return { ok: false, errors: errors.slice(0, 20) };
  }

  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exported_at: exportedAt,
      data: { passwords, bookmarks, notebooks, todoitems },
    },
  };
}
