export const NOTE_COLORS = [
  { id: 'default', color: 'rgba(255, 255, 255, 0.08)', accent: '#8B5CF6', label: 'Default' },
  { id: 'purple', color: 'rgba(139, 92, 246, 0.15)', accent: '#A78BFA', label: 'Purple' },
  { id: 'blue', color: 'rgba(59, 130, 246, 0.15)', accent: '#60A5FA', label: 'Blue' },
  { id: 'green', color: 'rgba(34, 197, 94, 0.15)', accent: '#4ADE80', label: 'Green' },
  { id: 'orange', color: 'rgba(249, 115, 22, 0.15)', accent: '#FB923C', label: 'Orange' },
  { id: 'pink', color: 'rgba(236, 72, 153, 0.15)', accent: '#F472B6', label: 'Pink' },
  { id: 'cyan', color: 'rgba(6, 182, 212, 0.15)', accent: '#22D3EE', label: 'Cyan' },
] as const;

export type NoteColorId = (typeof NOTE_COLORS)[number]['id'];

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  checklist: ChecklistItem[];
  colorId: NoteColorId;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
}

export type NotePreview = Pick<Note, 'id' | 'title' | 'updatedAt' | 'isPinned' | 'colorId'> & {
  preview: string;
  checklistTotal: number;
  checklistDone: number;
  wordCount: number;
};
