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
2. 执行远程数据库迁移：  
   `wrangler d1 execute <database_name> --remote --file=schema.sql`  
3. 部署代码：  
   `wrangler deploy`

## **自动化部署 (GitHub Actions)**

本项目支持通过 GitHub Actions 实现自动化部署。请完成以下配置：

### **1\. 配置 Secrets**

在 GitHub 仓库中，进入 **Settings \> Secrets and variables \> Actions**，添加以下 Secret：

* CF\_TOKEN: 您的 Cloudflare API Token（需具备 Workers 和 D1 编辑权限）。

### **2\. 配置 Variables**

在 GitHub 仓库中，进入 **Settings \> Secrets and variables \> Actions**，切换到 **Variables** 标签页，添加以下变量：

* WORKER\_NAME: Cloudflare Worker 的名称。  
* USER\_NAME: 用户名配置。  
* USER\_PSWD: 用户密码配置。  
* TIME\_ZONE: 时区设置。  
* AES\_KEY: 密码写入数据库加密KEY。  
* DB\_NAME: D1 数据库名称。  
* DB\_ID: D1 数据库 ID。

配置完成后，通过GitHub Actions 手动部署。