export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
  password?: string;
}
