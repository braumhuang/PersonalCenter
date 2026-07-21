# **项目名称**

这是一个基于 Cloudflare Workers 和 Cloudflare D1 数据库构建的项目。

## **本地开发**

要在本地环境运行此项目，请按照以下步骤操作：

1. 安装依赖：  
   `npm install`  
2. 初始化 D1 本地数据库（假设数据库名为 personal\_center\_db）：  
   `wrangler d1 execute personal-center-db --local --file=schema.sql`  
3. 启动本地开发服务器：  
   `wrangler dev --local`

## **手动部署**

若要手动将项目部署到 Cloudflare，请遵循以下流程：

1. 确保已根据您的环境修改 wrangler.toml 文件中的配置。  
2. 把.dev.vars文件中的配置部署到worker上，输入命令后回车，然后输入真正的值。   
   `wrangler secret put USER_PSWD --name <worker_name>`  
   `wrangler secret put AES_KEY --name <worker_name>`
3. 执行远程数据库迁移：  
   `wrangler d1 execute <database_name> --remote --file=schema.sql`  
4. 部署代码：  
   `wrangler deploy`

## **自动化部署 (GitHub Actions)**

本项目支持通过 GitHub Actions 实现自动化部署。请完成以下配置：

### **1\. 配置 Secrets**

在 GitHub 仓库中，进入 **Settings \> Secrets and variables \> Actions**，添加以下 Secret：

* CF\_TOKEN: 您的 Cloudflare API Token（需具备 Workers 和 D1 编辑权限）。
* USER\_PSWD: 用户密码配置。
* AES\_KEY: 密码读取写入数据库，解密加密的KEY，任意字符串。

### **2\. 配置 Variables**

在 GitHub 仓库中，进入 **Settings \> Secrets and variables \> Actions**，切换到 **Variables** 标签页，添加以下变量：

* WORKER\_NAME: Cloudflare Worker 的名称。  
* USER\_NAME: 用户名配置。    
* TIME\_ZONE: 时区设置。  
* DB\_NAME: D1 数据库名称。  
* DB\_ID: D1 数据库 ID。
* WORKER\_DOMAIN: 自定义网址，可选参数。

配置完成后，通过GitHub Actions 手动部署。


## **项目结构**

界面使用 Hono JSX 组件拆分，业务代码按照功能模块组织：

```text
src/
├── components/              # 公共布局、列表页和表单页
├── modules/
│   ├── password/            # 密码业务、页面和备份适配
│   ├── bookmark/            # 书签业务、页面和备份适配
│   ├── notebook/            # 笔记业务、页面和备份适配
│   ├── todoitem/            # 待办业务、页面和备份适配
│   └── website/             # 登录、会话、首页、后台首页、统一导入导出
├── index.ts                 # Worker 入口与模块注册
├── types.ts                 # Worker 环境类型
└── utils.ts                 # 加解密与时间工具
static/
├── css/admin.css            # 页面样式
├── js/admin.js              # 后台菜单、列表、导入及确认交互
├── js/home.js               # 首页待办交互
└── favicon.ico              # 网站图标
```

此次重构只调整代码组织方式，不改变数据库结构、页面样式或原有业务行为。CSS 和 JavaScript 均通过 `static` 目录提供。

手机屏幕（宽度不超过 768px）下，首页 `.safari-grid` 使用 `repeat(auto-fill, minmax(50px, 1fr))`。

## **网站数据导入与导出**

登录后台后，点击右上角“欢迎，用户名。”中的用户名，可打开以下菜单：

* **导出数据**：下载一个包含密码、书签、笔记和待办的 JSON 备份文件。
* **导入数据**：选择由本项目导出的 JSON 文件。系统会先完整校验格式，校验通过后再更新或新增记录；校验失败时会弹窗显示具体错误。

导入时的匹配规则：

* 密码按照 `note` 更新或新增。
* 书签、笔记和待办按照各自的 `id` 更新或新增。
* 导入不会删除当前数据库中未出现在备份文件里的记录。
* 登录会话所在的 `cookie` 表不会被导出或导入。

备份文件格式版本为 `personal-center-backup` / `version: 1`，主体结构如下：

```json
{
  "format": "personal-center-backup",
  "version": 1,
  "exported_at": "2026-07-21T00:00:00.000Z",
  "data": {
    "passwords": [],
    "bookmarks": [],
    "notebooks": [],
    "todoitems": []
  }
}
```

> 安全提示：为了可以在更换 `AES_KEY` 后恢复密码，JSON 备份中的密码是明文。请将备份文件存放在安全位置，不要上传到公开仓库或共享网盘。
