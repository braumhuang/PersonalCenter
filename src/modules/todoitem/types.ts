export interface TodoitemModel {
  id: number;
  title: string;
  content: string;
  todo_time: string;
  done: number;
}

export interface TodoitemBackupItem {
  id: number;
  title: string;
  content: string;
  todo_time: string;
  done: boolean;
}
