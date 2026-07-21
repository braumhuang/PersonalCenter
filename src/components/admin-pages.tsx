import { BaseLayout } from './layout';

export type TableCell = string | number;

interface ListPageProps {
  model: string;
  modelTitle: string;
  headers: string[];
  rows: TableCell[][];
  searchVal?: string;
  extraControls?: any;
  filterWidget?: any;
  userName?: string;
  status?: string;
}

export function ListPage({
  model,
  modelTitle,
  headers,
  rows,
  searchVal = '',
  extraControls = null,
  filterWidget = null,
  userName = '管理员',
  status = 'unused',
}: ListPageProps) {
  return (
    <BaseLayout title={modelTitle} user={userName}>
      <div id="breadcrumbs"><a href="/admin">首页</a> &rsaquo; <a href={`/admin/${model}`}>{modelTitle}</a></div>
      <div class="page-container">
        <div class="toolbar">
          <form method="get" action={`/admin/${model}`} class="search-form">
            <input type="text" name="q" value={searchVal} placeholder="关键词..." class="search-input" />
            <input type="hidden" name="status" value={status} />
            <button type="submit" class="btn btn-sec">搜索</button>
          </form>
          <div class="extra-controls">
            {extraControls}
            <a href={`/admin/${model}/add`} class="btn">+ 新增 {modelTitle}</a>
          </div>
        </div>

        {filterWidget}

        <form action={`/admin/${model}/delete-selected`} method="post" id="action-form">
          <div class="action-bar">
            <span class="action-label">动作:</span>
            <select name="action" class="action-select-control" required>
              <option value="">---------</option>
              <option value="delete">删除所选的 {modelTitle}</option>
            </select>
            <input type="hidden" name="status" value={status} />
            <button type="submit" class="btn btn-danger btn-action">执行选定</button>
          </div>

          <div class="app-box">
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th class="select-column"><input type="checkbox" id="action-toggle" /></th>
                    {headers.map((header) => <th>{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? rows.map((row) => {
                    const id = String(row[0]);
                    return (
                      <tr>
                        <td><input type="checkbox" name="selected_ids" value={id} class="action-select" /></td>
                        {row.map((cell, index) => index === 0
                          ? <td><a href={`/admin/${model}/edit?id=${encodeURIComponent(id)}`} class="record-link" dangerouslySetInnerHTML={{ __html: String(cell) }} /></td>
                          : <td dangerouslySetInnerHTML={{ __html: String(cell) }} />)}
                      </tr>
                    );
                  }) : <tr><td colspan={100} class="empty-row">暂无匹配的记录</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </div>
    </BaseLayout>
  );
}

interface FormPageProps {
  model: string;
  modelTitle: string;
  isEdit: boolean;
  fields: any;
  hiddenFields?: any;
  userName?: string;
  deleteUrl?: string;
}

export function FormPage({
  model,
  modelTitle,
  isEdit,
  fields,
  hiddenFields = null,
  userName = '管理员',
  deleteUrl = '',
}: FormPageProps) {
  return (
    <BaseLayout title={`${isEdit ? '修改' : '新增'} ${modelTitle}`} user={userName}>
      <div id="breadcrumbs">
        <a href="/admin">首页</a> &rsaquo;{' '}
        <a href={`/admin/${model}`}>{modelTitle}</a> &rsaquo;{' '}
        {isEdit ? '修改' : '新增'}
      </div>
      <div class="page-container">
        <div class="app-box">
          <h2>{isEdit ? '修改' : '新增'} {modelTitle}</h2>
          <form action={`/admin/${model}/save`} method="post">
            {hiddenFields}
            {fields}
            <div class="form-actions">
              <div>
                {isEdit && deleteUrl ? <a href={deleteUrl} class="btn btn-danger" data-confirm="确定要彻底删除该条记录吗？">删除</a> : null}
              </div>
              <div class="form-actions-buttons">
                <a href={`/admin/${model}`} class="btn btn-sec">返回</a>
                <button type="submit" class="btn">保存</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </BaseLayout>
  );
}
