export interface Point {
  x: number;
  y: number;
}

export interface DrawObject {
  id: string;
  type: 'path' | 'line' | 'rect' | 'circle' | 'text';
  points?: Point[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color: string;
  lineWidth: number;
  createdBy: string;
  createdAt: string;
}

export interface BoardData {
  objects: DrawObject[];
  version: number;
}

export interface Board {
  id: string;
  project_id: string;
  name: string;
  data: BoardData;
  created_at: string;
  updated_at: string;
}

export interface WSMessage {
  type: string;
  board_id: string;
  user_id: string;
  payload: any;
}

export type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'text' | 'select';
