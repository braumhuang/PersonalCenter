import { FormPage, ListPage, type TableCell } from '../../components/admin-pages';
import type { NotebookModel } from './types';

export function NotebookListPage({ rows, searchVal, userName }: { rows: TableCell[][]; searchVal: string; userName: string }) {
  return <ListPage model="notebook" modelTitle="笔记" headers={['ID', '标题', '内容', '时间']} rows={rows} searchVal={searchVal} userName={userName} />;
}

function NotebookFields({ record }: { record?: NotebookModel }) {
  return (
    <>
      <div class="form-row"><label>标题:</label><input type="text" name="title" value={record?.title} required /></div>
      <div class="form-row"><label>内容:</label><textarea name="content" rows={20} required>{record?.content}</textarea></div>
    </>
  );
}

export function NotebookAddPage({ userName }: { userName: string }) {
  return <FormPage model="notebook" modelTitle="笔记" isEdit={false} fields={<NotebookFields />} userName={userName} />;
}

export function NotebookEditPage({ record, userName }: { record: NotebookModel; userName: string }) {
  return (
    <FormPage
      model="notebook"
      modelTitle="笔记"
      isEdit
      fields={<NotebookFields record={record} />}
      hiddenFields={
        <>
          <input type="hidden" name="id" value={record.id} />
          <input type="hidden" name="create_time" value={record.create_time} />
        </>
      }
      userName={userName}
      deleteUrl={`/admin/notebook/delete-single?id=${record.id}`}
    />
  );
}
