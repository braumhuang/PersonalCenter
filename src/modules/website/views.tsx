import { BaseLayout } from '../../components/layout';
import type { BookmarkModel } from '../bookmark/types';
import type { TodoitemModel } from '../todoitem/types';

export function LoginPage({ error = '' }: { error?: string }) {
  return (
    <BaseLayout title="个人中心" hideNav>
      <div class="login-container">
        <div class="login-title">个人中心</div>
        <form action="/admin/login" method="post" class="login-form">
          {error ? <p class="login-error">{error}</p> : null}
          <div class="login-field">
            <label class="login-label">用户名:</label>
            <input type="text" name="username" class="login-input" required />
          </div>
          <div class="login-field-last">
            <label class="login-label">密码:</label>
            <input type="password" name="password" class="login-input" required />
          </div>
          <button type="submit" class="btn login-submit">登录</button>
        </form>
      </div>
    </BaseLayout>
  );
}

const modules = [
  { path: 'password', title: '密码' },
  { path: 'bookmark', title: '书签' },
  { path: 'notebook', title: '笔记' },
  { path: 'todoitem', title: '待办' },
];

export function DashboardPage({ userName }: { userName: string }) {
  return (
    <BaseLayout title="站点管理" user={userName}>
      <div id="breadcrumbs"><a href="/admin">首页</a></div>
      <div id="main-container">
        <div class="app-box">
          <h2>模块</h2>
          <div class="table-responsive">
            <table>
              <thead><tr><th>名称</th><th class="dashboard-actions-column">操作</th></tr></thead>
              <tbody>
                {modules.map((module) => (
                  <tr>
                    <td><a href={`/admin/${module.path}`} class="dashboard-module-link">{module.title}</a></td>
                    <td class="dashboard-actions-column"><a href={`/admin/${module.path}/add`} class="dashboard-action-link dashboard-action-link-first">新增</a><a href={`/admin/${module.path}`} class="dashboard-action-link">修改</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}

export function HomePage({ bookmarks, todoitems, userName }: { bookmarks: BookmarkModel[]; todoitems: TodoitemModel[]; userName: string }) {
  return (
    <BaseLayout title="首页工作台" hideNav scripts={['/js/home.js']}>
      <header id="header">
        <div class="branding"><h1><strong>{userName}</strong></h1></div>
        <div id="user-tools">
          <a href="/admin" class="front-header-link">后台管理</a> /{' '}
          <a href="/admin/logout" class="front-header-link">注销</a>
        </div>
      </header>
      <div class="home-container">
        {todoitems.length > 0 ? (
          <div id="todo-section" class="app-box home-todo-section">
            <h2>临近待办</h2>
            <div class="table-responsive">
              <table>
                <thead><tr><th>时间</th><th>标题</th><th class="complete-column">完成</th></tr></thead>
                <tbody>
                  {todoitems.map((todoitem) => (
                    <tr id={`todo-row-${todoitem.id}`}>
                      <td class="todo-time">{todoitem.todo_time}</td>
                      <td class="text-bold">{todoitem.title}</td>
                      <td class="text-center"><input type="checkbox" data-front-todo-id={todoitem.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <h3 class="home-section-title">书签导航</h3>
        <div class="safari-grid">
          {bookmarks.length > 0 ? bookmarks.map((bookmark) => (
            <a class="safari-item" href={bookmark.url} target="_blank">
              <div class="safari-icon">{bookmark.name.substring(0, 2).toUpperCase()}</div>
              <div class="safari-name">{bookmark.name}</div>
            </a>
          )) : <p class="muted-text">暂无公开配置的前台书签，请去后端开放显示权限。</p>}
        </div>
      </div>
    </BaseLayout>
  );
}
