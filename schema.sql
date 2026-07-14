-- 密码资产模型
CREATE TABLE IF NOT EXISTS password (
    note TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pswd TEXT NOT NULL,
    urls TEXT NOT NULL,
    info TEXT
);

-- 书签导航模型
CREATE TABLE IF NOT EXISTS bookmark (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    show BOOLEAN DEFAULT 0
);

-- 个人随笔笔记本模型
CREATE TABLE IF NOT EXISTS notebook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    create_time TEXT NOT NULL
);

-- 待办时效追踪模型
CREATE TABLE IF NOT EXISTS todoitem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    todo_time TEXT NOT NULL,
    done BOOLEAN DEFAULT 0
);
