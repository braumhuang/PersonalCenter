import { FormPage, ListPage, type TableCell } from '../../components/admin-pages';
import type { BookmarkModel } from './types';

export function BookmarkExtraControls() {
  return (
    <>
      <a href="/admin/bookmark/export" class="btn btn-sec btn-small">导出 HTML</a>
      <button type="button" class="btn btn-sec btn-small" data-file-input="html_file">导入 HTML</button>
      <form id="html_form" action="/admin/bookmark/import" method="post" enctype="multipart/form-data" class="hidden-upload-form">
        <input type="file" id="html_file" name="html" data-auto-submit-form="html_form" />
      </form>
    </>
  );
}

export function BookmarkListPage({ rows, searchVal, userName }: { rows: TableCell[][]; searchVal: string; userName: string }) {
  return <ListPage model="bookmark" modelTitle="书签" headers={['ID', '站名', '显示']} rows={rows} searchVal={searchVal} extraControls={<BookmarkExtraControls />} userName={userName} />;
}

function BookmarkFields({ record }: { record?: BookmarkModel }) {
  return (
    <>
      <div class="form-row"><label>站名:</label><input type="text" name="name" value={record?.name} required /></div>
      <div class="form-row"><label>网址:</label><input type="text" name="url" value={record?.url} required placeholder={record ? undefined : 'https://'} /></div>
      <div class="form-row"><label>显示:</label><input type="checkbox" name="show" value="1" checked={record?.show === 1} /></div>
    </>
  );
}

export function BookmarkAddPage({ userName }: { userName: string }) {
  return <FormPage model="bookmark" modelTitle="书签" isEdit={false} fields={<BookmarkFields />} userName={userName} />;
}

export function BookmarkEditPage({ record, userName }: { record: BookmarkModel; userName: string }) {
  return <FormPage model="bookmark" modelTitle="书签" isEdit fields={<BookmarkFields record={record} />} hiddenFields={<input type="hidden" name="id" value={record.id} />} userName={userName} deleteUrl={`/admin/bookmark/delete-single?id=${record.id}`} />;
}
