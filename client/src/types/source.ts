export interface Workspace {
  _id: string;
  title: string;
  subject: string;
  topic?: string;
  description?: string;
  userId: string;
  createdAt: string;
}

export interface SourceChunk {
  _id: string;
  text: string;
  pageNumber: number;
  chunkIndex: number;
}

export interface Source {
  _id: string;
  workspaceId: string;
  filename: string;
  type: string;
  size: number;
  pages: number;
  status: 'uploading' | 'extracting' | 'analyzing' | 'preparing' | 'ready' | 'failed';
  rawText?: string;
  chunks?: SourceChunk[];
  error?: string;
  createdAt: string;
}
