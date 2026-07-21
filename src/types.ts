export interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
  USER_NAME: string;
  USER_PSWD: string;
  TIME_ZONE: string;
  AES_KEY: string;
}

export interface PasswordModel {
  note: string;
  name: string;
  pswd: string;
  urls: string;
  info: string;
}

export interface BookmarkModel {
  id: number;
  name: string;
  url: string;
  show: number;
}

export interface NotebookModel {
  id: number;
  title: string;
  content: string;
  create_time: string;
}

export interface TodoitemModel {
  id: number;
  title: string;
  content: string;
  todo_time: string;
  done: number;
}
