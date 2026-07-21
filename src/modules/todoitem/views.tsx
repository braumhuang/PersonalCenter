import { FormPage, ListPage, type TableCell } from '../../components/admin-pages';
import type { TodoitemModel } from './types';

export function TodoitemFilter({ q, status }: { q: string; status: string }) {
  return (
    <div class="filter-bar">
      状态筛选：
      <a href={`/admin/todoitem?status=pending&q=${q}`} class={`filter-link${status === 'pending' ? ' active' : ''}`}>待办理</a>
      <a href={`/admin/todoitem?status=completed&q=${q}`} class={`filter-link${status === 'completed' ? ' active' : ''}`}>已完成</a>
      <a href={`/admin/todoitem?status=expired&q=${q}`} class={`filter-link${status === 'expired' ? ' active' : ''}`}>已过期</a>
    </div>
  );
}

export function TodoitemListPage({ rows, searchVal, status, userName }: { rows: TableCell[][]; searchVal: string; status: string; userName: string }) {
  return <ListPage model="todoitem" modelTitle="待办" headers={['ID', '标题', '时间', '状态', '完成']} rows={rows} searchVal={searchVal} filterWidget={<TodoitemFilter q={searchVal} status={status} />} userName={userName} status={status} />;
}

function TodoitemFields({ record, defaultTime }: { record?: TodoitemModel; defaultTime: string }) {
  return (
    <>
      <div class="form-row"><label>标题:</label><input type="text" name="title" value={record?.title} required /></div>
      <div class="form-row"><label>时间:</label><input type="datetime-local" step="1" name="todo_time" value={defaultTime} required /></div>
      <div class="form-row"><label>详情:</label><textarea name="content" rows={10}>{record?.content}</textarea></div>
      <div class="form-row"><label>完成:</label><input type="checkbox" name="done" value="1" checked={record?.done === 1} /></div>
    </>
  );
}

export function TodoitemAddPage({ defaultTime, userName }: { defaultTime: string; userName: string }) {
  return <FormPage model="todoitem" modelTitle="待办" isEdit={false} fields={<TodoitemFields defaultTime={defaultTime} />} userName={userName} />;
}

export function TodoitemEditPage({ record, userName }: { record: TodoitemModel; userName: string }) {
  return <FormPage model="todoitem" modelTitle="待办" isEdit fields={<TodoitemFields record={record} defaultTime={record.todo_time.replace(' ', 'T')} />} hiddenFields={<input type="hidden" name="id" value={record.id} />} userName={userName} deleteUrl={`/admin/todoitem/delete-single?id=${record.id}`} />;
}
