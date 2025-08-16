// TypeScript interfaces for our new MVP tables
export interface Document {
  id: string;
  user_id: string;
  title: string;
  type: 'pdf' | 'txt' | 'docx';
  content: any;
  metadata: any;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface DocumentInsert {
  user_id: string;
  title: string;
  type: 'pdf' | 'txt' | 'docx';
  content: any;
  metadata?: any;
  status?: 'processing' | 'completed' | 'failed';
}

export interface Chunk {
  id: string;
  document_id: string;
  content: string;
  metadata: any;
  position: number;
  embedding?: number[];
  created_at: string;
}

export interface ChunkInsert {
  document_id: string;
  content: string;
  metadata?: any;
  position: number;
  embedding?: number[];
}

export interface Node {
  id: string;
  document_id: string;
  title: string;
  summary?: string;
  level: 0 | 1 | 2; // Topic, Concept, Leaf
  position_x: number;
  position_y: number;
  parent_id?: string;
  metadata: any;
  created_at: string;
}

export interface NodeInsert {
  document_id: string;
  title: string;
  summary?: string;
  level: 0 | 1 | 2;
  position_x?: number;
  position_y?: number;
  parent_id?: string;
  metadata?: any;
}

export interface Question {
  id: string;
  node_id: string;
  type: 'mcq' | 'cloze' | 'short_answer';
  question: string;
  correct_answer: string;
  distractors: string[];
  evidence_anchor: string;
  metadata: any;
  created_at: string;
}

export interface QuestionInsert {
  node_id: string;
  type?: 'mcq' | 'cloze' | 'short_answer';
  question: string;
  correct_answer: string;
  distractors?: string[];
  evidence_anchor: string;
  metadata?: any;
}

export interface Attempt {
  id: string;
  question_id: string;
  user_id: string;
  answer: string;
  is_correct: boolean;
  time_spent?: number;
  session_id?: string;
  created_at: string;
}

export interface AttemptInsert {
  question_id: string;
  user_id: string;
  answer: string;
  is_correct: boolean;
  time_spent?: number;
  session_id?: string;
}

export interface Review {
  id: string;
  node_id: string;
  user_id: string;
  mastery_score: number;
  next_review_date: string;
  review_interval: number;
  last_reviewed: string;
  created_at: string;
}

export interface ReviewInsert {
  node_id: string;
  user_id: string;
  mastery_score?: number;
  next_review_date?: string;
  review_interval?: number;
  last_reviewed?: string;
}

// Existing table types from current schema
export interface Profile {
  id: string;
  username: string;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  username: string;
  xp?: number;
  level?: number;
}

export interface Mindmap {
  id: string;
  owner_id?: string;
  title: string;
  intent?: string;
  content: any;
  created_at: string;
  updated_at: string;
}

export interface MindmapInsert {
  owner_id?: string;
  title: string;
  intent?: string;
  content: any;
}