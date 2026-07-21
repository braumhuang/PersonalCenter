interface BaseLayoutProps {
  title: string;
  user?: string | null;
  hideNav?: boolean;
  scripts?: string[];
  children: any;
}

function AdminHeader({ user }: { user?: string | null }) {
  return (
    <>
      <header id="header">
        <div class="branding">
          <h1><a href="/admin">后台管理</a></h1>
        </div>
        <div id="user-tools">
          <span>欢迎</span>
          <span class="user-menu-wrap">
            <button type="button" id="user-menu-toggle" class="user-menu-toggle" aria-haspopup="true" aria-expanded="false"><strong>{user || '管理员'}</strong></button>
            <span id="user-dropdown" class="user-dropdown" hidden>
              <button type="button" id="data-import-trigger">导入数据</button>
              <a href="/admin/data/export">导出数据</a>
            </span>
          </span>
          <a href="/" target="_blank">前台首页</a> /
          <a href="/admin/logout">注销</a>
        </div>
      </header>
      <input type="file" id="data-import-file" name="data_file" accept=".json,application/json" hidden />
      <div id="data-modal" class="data-modal" hidden role="dialog" aria-modal="true" aria-labelledby="data-modal-title">
        <div class="data-modal-card">
          <h2 id="data-modal-title" class="data-modal-title">提示</h2>
          <p id="data-modal-message" class="data-modal-message"></p>
          <div class="data-modal-actions">
            <button type="button" id="data-modal-close" class="btn">确定</button>
          </div>
        </div>
      </div>
    </>
  );
}

export function BaseLayout({ title, user = null, hideNav = false, scripts = [], children }: BaseLayoutProps) {
  const pageScripts = hideNav ? scripts : ['/js/admin.js', ...scripts];

  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="/css/admin.css" />
        <title>{title} | 个人中心</title>
      </head>
      <body>
        {!hideNav && <AdminHeader user={user} />}
        {children}
        {pageScripts.map((script) => <script src={script} defer></script>)}
      </body>
    </html>
  );
}
