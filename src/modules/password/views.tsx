import { FormPage, ListPage, type TableCell } from '../../components/admin-pages';
import type { PasswordModel } from './types';

export function PasswordExtraControls() {
  return (
    <>
      <a href="/admin/password/export" class="btn btn-sec btn-small">导出 CSV</a>
      <button type="button" class="btn btn-sec btn-small" data-file-input="csv_file">导入 CSV</button>
      <form id="csv_form" action="/admin/password/import" method="post" enctype="multipart/form-data" class="hidden-upload-form">
        <input type="file" id="csv_file" name="csv" data-auto-submit-form="csv_form" />
      </form>
    </>
  );
}

export function PasswordListPage({ rows, searchVal, userName }: { rows: TableCell[][]; searchVal: string; userName: string }) {
  return <ListPage model="password" modelTitle="密码" headers={['备注', '账户', '密码', '域名']} rows={rows} searchVal={searchVal} extraControls={<PasswordExtraControls />} userName={userName} />;
}

function PasswordFields({ record, plainPassword = '' }: { record?: PasswordModel; plainPassword?: string }) {
  return (
    <>
      <div class="form-row"><label>备注:</label><input type="text" name="note" value={record?.note} placeholder={record ? undefined : '主键'} readonly={record ? true : undefined} class={record ? 'readonly-input' : undefined} required={!record} /></div>
      <div class="form-row"><label>账户:</label><input type="text" name="name" value={record?.name} required /></div>
      <div class="form-row"><label>密码:</label><input type="text" name="pswd" value={record ? plainPassword : undefined} required /></div>
      <div class="form-row"><label>域名:</label><textarea name="urls" rows={5} placeholder={'google.com\ngoogle.cn'}>{record?.urls}</textarea></div>
      <div class="form-row"><label>信息:</label><textarea name="info" rows={10}>{record?.info || ''}</textarea></div>
    </>
  );
}

export function PasswordAddPage({ userName }: { userName: string }) {
  return <FormPage model="password" modelTitle="密码" isEdit={false} fields={<PasswordFields />} userName={userName} />;
}

export function PasswordEditPage({ record, plainPassword, userName }: { record: PasswordModel; plainPassword: string; userName: string }) {
  return <FormPage model="password" modelTitle="密码" isEdit fields={<PasswordFields record={record} plainPassword={plainPassword} />} userName={userName} deleteUrl={`/admin/password/delete-single?id=${encodeURIComponent(record.note)}`} />;
}
