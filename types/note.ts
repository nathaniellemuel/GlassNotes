export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
}

export type NotePreview = Pick<Note, 'id' | 'title' | 'updatedAt' | 'isPinned'> & {
  preview: string;
};
