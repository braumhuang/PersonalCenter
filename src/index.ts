import { Hono } from 'hono';
import { registerBookmarkModule } from './modules/bookmark/routes';
import { registerNotebookModule } from './modules/notebook/routes';
import { registerPasswordModule } from './modules/password/routes';
import { registerTodoitemModule } from './modules/todoitem/routes';
import { registerWebsiteModule } from './modules/website/routes';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const response = await c.env.ASSETS?.fetch(c.req.raw);
  if (response && response.status !== 404) return response;
  await next();
});

registerWebsiteModule(app);
registerPasswordModule(app);
registerBookmarkModule(app);
registerNotebookModule(app);
registerTodoitemModule(app);

export default app;
