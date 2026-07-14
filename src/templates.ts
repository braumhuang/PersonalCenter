const DjangoCSS = `
  :root { --primary: #417690; --secondary: #79aec8; --accent: #f5dd5d; --darker: #264b5d; --body-bg: #f8f8f8; font-family: "Roboto","Lucida Grande","DejaVu Sans","Bitstream Vera Sans",Verdana,Arial,sans-serif; }
  body { margin: 0; padding: 0; background: var(--body-bg); color: #333; font-size: 14px; }
  header#header { background: var(--primary); color: #fff; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; }
  header#header a { color: #fff; text-decoration: none; }
  header#header .branding h1 { margin: 0; font-size: 20px; font-weight: 300; }
  #user-tools { font-size: 12px; }
  #breadcrumbs { background: #fff; padding: 8px 20px; border-bottom: 1px solid #ccc; font-size: 12px; color: #666; }
  #breadcrumbs a { color: #447e9b; text-decoration: none; }
  #main-container { display: flex; padding: 20px; gap: 20px; max-width: 1200px; margin: 0 auto; flex-wrap: wrap; }
  .app-box { background: #fff; border: 1px solid #e8e8e8; border-radius: 4px; width: 100%; margin-bottom: 20px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .app-box h2 { background: var(--primary); color: #fff; margin: 0; padding: 10px 15px; font-size: 14px; font-weight: 400; }
  
  /* 适配核心：手机端支持水平滚动且长文本不换行挤压 */
  .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }
  .app-box table { width: 100%; border-collapse: collapse; text-align: left; }
  .app-box td, .app-box th { padding: 8px 15px; border-bottom: 1px solid #eee; white-space: nowrap; }
  .app-box th { background: #f8f8f8; font-size: 12px; color: #666; text-transform: uppercase; }
  .app-box tr:hover { background: #fdfdfd; }
  
  .btn { background: var(--primary); color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 13px; display: inline-block;}
  .btn:hover { background: var(--darker); }
  .btn-danger { background: #ba2121; }
  .btn-danger:hover { background: #a41515; }
  .btn-sec { background: #999; }
  .btn-sec:hover { background: #666; }
  
  .form-row { padding: 15px; border-bottom: 1px solid #eee; display: flex; align-items: flex-start; }
  .form-row label { width: 60px; font-weight: bold; color: #666; font-size: 13px; margin-top: 4px; }
  .form-row input[type="text"], .form-row input[type="password"], .form-row input[type="datetime-local"], .form-row textarea, .form-row select { flex: 1; width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
  .form-row input[type="checkbox"] { margin-top: 7px; }
  .form-actions { background: #f8f8f8; padding: 15px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; }
  
  .safari-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 20px; padding: 20px; }
  .safari-item { display: flex; flex-direction: column; align-items: center; text-decoration: none; color: #333; }
  .safari-icon { width: 60px; height: 60px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 8px; color: var(--primary); transition: transform 0.2s; }
  .safari-item:hover .safari-icon { transform: scale(1.05); }
  .safari-name { font-size: 12px; text-align: center; max-width: 90px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }

  @media (max-width: 768px) {
    #main-container { padding: 10px; }
    .form-row { flex-direction: column; }
    .form-row label { width: 100%; margin-bottom: 5px; }
    .form-row input[type="text"], .form-row input[type="datetime-local"], .form-row textarea, .form-row select { width: 100%; }
    header#header { flex-direction: column; gap: 10px; text-align: center; }
  }
`;

export function baseLayout(title: string, content: string, user: string | null = null, hideNav = false): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | 个人中心</title>
    <style>${DjangoCSS}</style>
</head>
<body>
    ${!hideNav ? `
    <header id="header">
        <div class="branding">
            <h1><a href="/admin">后台管理</a></h1>
        </div>
        <div id="user-tools">
            欢迎，<strong>${user || '管理员'}</strong>。
            <a href="/" target="_blank">前台首页</a> / 
            <a href="/admin/logout">注销</a>
        </div>
    </header>
    ` : ''}
    ${content}
</body>
</html>`;
}

export function loginPage(error = ''): string {
  const content = `
  <div style="max-width: 400px; margin: 100px auto; background: #fff; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      <div style="background:var(--primary); color:#fff; padding:12px 15px; font-size:16px; font-weight:bold; text-align:center;">个人中心</div>
      <form action="/admin/login" method="POST" style="padding: 20px;">
          ${error ? `<p style="color:#ba2121; font-weight:bold; margin-bottom:15px; font-size:13px;">${error}</p>` : ''}
          <div style="margin-bottom: 15px;">
              <label style="display:block; margin-bottom:5px; color:#666; font-weight:bold;">用户名:</label>
              <input type="text" name="username" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;" required>
          </div>
          <div style="margin-bottom: 20px;">
              <label style="display:block; margin-bottom:5px; color:#666; font-weight:bold;">密码:</label>
              <input type="password" name="password" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;" required>
          </div>
          <button type="submit" class="btn" style="width: 100%; padding: 10px;">登录</button>
      </form>
  </div>
  `;
  return baseLayout('个人中心', content, null, true);
}

export function dashboardPage(userName: string): string {
  const content = `
  <div id="breadcrumbs"><a href="/admin">首页</a></div>
  <div id="main-container">
      <div class="app-box">
          <h2>模块</h2>
          <div class="table-responsive">
              <table>
                  <thead>
                      <tr>
                          <th>名称</th>
                          <th style="width:180px; text-align:right;">操作</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td><a href="/admin/password" style="color:#447e9b; font-weight:bold; text-decoration:none;">密码</a></td>
                          <td style="text-align:right;"><a href="/admin/password/add" style="font-size:12px; color:#555; margin-right:15px;">新增</a><a href="/admin/password" style="font-size:12px; color:#555;">修改</a></td>
                      </tr>
                      <tr>
                          <td><a href="/admin/bookmark" style="color:#447e9b; font-weight:bold; text-decoration:none;">书签</a></td>
                          <td style="text-align:right;"><a href="/admin/bookmark/add" style="font-size:12px; color:#555; margin-right:15px;">新增</a><a href="/admin/bookmark" style="font-size:12px; color:#555;">修改</a></td>
                      </tr>
                      <tr>
                          <td><a href="/admin/notebook" style="color:#447e9b; font-weight:bold; text-decoration:none;">笔记</a></td>
                          <td style="text-align:right;"><a href="/admin/notebook/add" style="font-size:12px; color:#555; margin-right:15px;">新增</a><a href="/admin/notebook" style="font-size:12px; color:#555;">修改</a></td>
                      </tr>
                      <tr>
                          <td><a href="/admin/todoitem" style="color:#447e9b; font-weight:bold; text-decoration:none;">待办</a></td>
                          <td style="text-align:right;"><a href="/admin/todoitem/add" style="font-size:12px; color:#555; margin-right:15px;">新增</a><a href="/admin/todoitem" style="font-size:12px; color:#555;">修改</a></td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
  </div>
  `;
  return baseLayout('站点管理', content, userName);
}

export function listPage(model: string, modelTitle: string, headers: string[], rows: any[][], searchVal = '', extraControls = '', filterWidget = '', userName = '管理员', status = 'unused'): string {
  let tableRows = '';
  rows.forEach((row) => {
    const id = row[0];
    tableRows += `<tr>
      <td><input type="checkbox" name="selected_ids" value="${id}" class="action-select"></td>
      ${row.map((cell, idx) => idx === 0 ? `<td><a href="/admin/${model}/edit?id=${encodeURIComponent(id)}" style="color:#447e9b; font-weight:bold; text-decoration:none;">${cell}</a></td>` : `<td>${cell}</td>`).join('')}
    </tr>`;
  });

  const content = `
  <div id="breadcrumbs"><a href="/admin">首页</a> &rsaquo; <a href="/admin/${model}">${modelTitle}</a></div>
  
  <div style="padding: 20px; max-width:1200px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
          <form method="GET" action="/admin/${model}" style="display:flex; gap:5px;">
              <input type="text" name="q" value="${searchVal}" placeholder="关键词..." style="padding:6px; border:1px solid #ccc; border-radius:4px; width:240px;">
              <input type="hidden" name="status" value="${status}">
              <button type="submit" class="btn btn-sec">搜索</button>
          </form>
          <div style="display:flex; gap:8px; align-items:center;">
              ${extraControls}
              <a href="/admin/${model}/add" class="btn">+ 新增 ${modelTitle}</a>
          </div>
      </div>
      
      ${filterWidget}

      <form action="/admin/${model}/delete-selected" method="POST" id="action-form">
          <div style="background:#dae5ec; padding:8px 15px; font-size:13px; margin-bottom:10px; border-radius:4px; display:flex; align-items:center; gap:10px;">
              <span style="color:#666;">动作:</span>
              <select name="action" style="padding:4px; border-radius:4px;" required>
                  <option value="">---------</option>
                  <option value="delete">删除所选的 ${modelTitle}</option>
              </select>
              <input type="hidden" name="status" value="${status}">
              <button type="submit" class="btn btn-danger" style="padding:4px 10px; font-size:12px;">执行选定</button>
          </div>

          <div class="app-box">
              <div class="table-responsive">
                  <table>
                      <thead>
                          <tr>
                              <th style="width: 30px;"><input type="checkbox" id="action-toggle"></th>
                              ${headers.map(h => `<th>${h}</th>`).join('')}
                          </tr>
                      </thead>
                      <tbody>
                          ${tableRows || '<tr><td colspan="100%" style="text-align:center;color:#999;padding:30px;">暂无匹配的记录</td></tr>'}
                      </tbody>
                  </table>
              </div>
          </div>
      </form>
  </div>
  
  <script>
      document.getElementById('action-toggle').addEventListener('change', function(e) {
          document.querySelectorAll('.action-select').forEach(cb => cb.checked = e.target.checked);
      });
      
      async function toggleStatus(endpoint, id, checkbox) {
          try {
              const res = await fetch(\`/admin/\${endpoint}/toggle-field\`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ id, checked: checkbox.checked })
              });
              if (!res.ok) alert('状态更新失败，请刷新页面重试');
          } catch(e) {
              alert('请求网络异常');
          }
      }
  </script>
  `;
  return baseLayout(modelTitle, content, userName);
}

export function formPage(model: string, modelTitle: string, isEdit: boolean, fieldsHtml: string, hiddenFields = '', userName = '管理员', deleteUrl = ''): string {
  const content = `
  <div id="breadcrumbs">
      <a href="/admin">首页</a> &rsaquo; 
      <a href="/admin/${model}">${modelTitle}</a> &rsaquo; 
      ${isEdit ? '修改' : '新增'}
  </div>
  <div style="padding: 20px; max-width:1200px; margin:0 auto;">
      <div class="app-box">
          <h2>${isEdit ? '修改' : '新增'} ${modelTitle}</h2>
          <form action="/admin/${model}/save" method="POST">
              ${hiddenFields}
              ${fieldsHtml}
              <div class="form-actions">
                  <div>
                      ${isEdit && deleteUrl ? `<a href="${deleteUrl}" class="btn btn-danger" onclick="return confirm('确定要彻底删除该条记录吗？')">删除</a>` : ''}
                  </div>
                  <div style="display:flex; gap:10px;">
                      <a href="/admin/${model}" class="btn btn-sec">返回</a>
                      <button type="submit" class="btn">保存</button>
                  </div>
              </div>
          </form>
      </div>
  </div>
  `;
  return baseLayout(`${isEdit ? '修改' : '新增'} ${modelTitle}`, content, userName);
}

export function indexPage(bookmarks: any[], todos: any[], userName: string): string {
  const todoListHtml = todos.length > 0 ? `
    <div id="todo-section" class="app-box" style="margin-bottom: 30px;">
        <h2>临近待办</h2>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>时间</th>
                        <th>标题</th>
                        <th style="width:80px; text-align:center;">完成</th>
                    </tr>
                </thead>
                <tbody>
                    ${todos.map(t => `
                        <tr id="todo-row-${t.id}">
                            <td style="color:#c678dd; font-size:12px;">${t.todo_time}</td>
                            <td style="font-weight:bold;">${t.title}</td>
                            <td style="text-align:center;">
                                <input type="checkbox" onchange="frontCompleteTodo(${t.id})">
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
  ` : '';

  const gridHtml = bookmarks.map(b => {
    let displayLetter = b.name.substring(0, 2).toUpperCase();
    return `
    <a class="safari-item" href="${b.url}" target="_blank">
        <div class="safari-icon">${displayLetter}</div>
        <div class="safari-name">${b.name}</div>
    </a>
    `;
  }).join('');

  const content = `
  <header id="header">
      <div class="branding"><h1><strong>${userName}</strong></h1></div>
      <div id="user-tools">
          <a href="/admin" style="font-weight:bold;">后台管理</a> / 
          <a href="/admin/logout" style="font-weight:bold;">注销</a>
      </div>
  </header>
  <div style="max-width: 1000px; margin: 40px auto; padding: 0 20px;">
      ${todoListHtml}
      
      <h3 style="color:#555; border-bottom:2px solid #ddd; padding-bottom:8px; font-weight:300; font-size:18px;">书签导航</h3>
      <div class="safari-grid">
          ${gridHtml || '<p style="color:#999;">暂无公开配置的前台书签，请去后端开放显示权限。</p>'}
      </div>
  </div>
  <script>
      async function frontCompleteTodo(id) {
          try {
              const res = await fetch('/admin/todoitem/toggle-field', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ id, checked: true })
              });
              if (res.ok) {
                  const row = document.getElementById('todo-row-' + id);
                  if (row) row.remove();
                  
                  const remainingRows = document.querySelectorAll('#todo-section tbody tr');
                  if (remainingRows.length === 0) {
                      const sect = document.getElementById('todo-section');
                      if (sect) sect.remove();
                  }
              } else {
                  alert('完成待办失败');
              }
          } catch(e) {
              alert('操作网络异常');
          }
      }
  </script>
  `;
  return baseLayout('首页工作台', content, null, true);
}
