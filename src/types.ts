import type { Hono } from 'hono';

export interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
  USER_NAME: string;
  USER_PSWD: string;
  TIME_ZONE: string;
  AES_KEY: string;
}

export type App = Hono<{ Bindings: Env }>;
