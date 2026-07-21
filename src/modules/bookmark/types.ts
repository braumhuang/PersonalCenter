export interface BookmarkModel {
  id: number;
  name: string;
  url: string;
  show: number;
}

export interface BookmarkBackupItem {
  id: number;
  name: string;
  url: string;
  show: boolean;
}
