import fs from 'fs/promises';
import path from 'path';
import { CONFIG } from '../config/index.js';
import type { Note, NoteIndex } from '../types/index.js';

const NOTES_BASE_PATH = CONFIG.storage.notesBasePath;
const INDEX_FILE = path.join(NOTES_BASE_PATH, 'index.json');

// 生成16位随机ID
function generateId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// 确保目录存在
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// 读取索引文件
async function readIndex(): Promise<NoteIndex> {
  try {
    await ensureDirectory(NOTES_BASE_PATH);
    const data = await fs.readFile(INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // 如果索引文件不存在，返回空索引
    return { notes: [] };
  }
}

// 写入索引文件
async function writeIndex(index: NoteIndex): Promise<void> {
  await ensureDirectory(NOTES_BASE_PATH);
  await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

// 从文件系统同步索引
export async function syncIndexFromFileSystem(): Promise<NoteIndex> {
  try {
    await ensureDirectory(NOTES_BASE_PATH);
    const entries = await fs.readdir(NOTES_BASE_PATH, { withFileTypes: true });

    const notes: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const noteFilePath = path.join(NOTES_BASE_PATH, entry.name, 'note.json');
        try {
          await fs.access(noteFilePath);
          notes.push(entry.name);
        } catch {
          // 如果 note.json 不存在，跳过
        }
      }
    }

    const index: NoteIndex = { notes };
    await writeIndex(index);

    return index;
  } catch (error) {
    console.error('Error syncing note index:', error);
    throw error;
  }
}

// 获取所有笔记
export async function getAllNotes(): Promise<Note[]> {
  const index = await readIndex();
  const notes: Note[] = [];

  for (const noteId of index.notes) {
    try {
      const note = await getNoteById(noteId);
      if (note) {
        notes.push(note);
      }
    } catch (error) {
      console.error(`Error reading note ${noteId}:`, error);
    }
  }

  // 按更新时间降序排序
  return notes.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// 根据ID获取笔记
export async function getNoteById(id: string): Promise<Note | null> {
  try {
    const notePath = path.join(NOTES_BASE_PATH, id, 'note.json');
    const data = await fs.readFile(notePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading note ${id}:`, error);
    return null;
  }
}

// 创建新笔记
export async function createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const id = generateId();
  const now = new Date().toISOString();

  const note: Note = {
    id,
    ...noteData,
    createdAt: now,
    updatedAt: now,
  };

  // 创建笔记目录
  const noteDir = path.join(NOTES_BASE_PATH, id);
  await ensureDirectory(noteDir);

  // 保存笔记
  const notePath = path.join(noteDir, 'note.json');
  await fs.writeFile(notePath, JSON.stringify(note, null, 2), 'utf-8');

  // 更新索引
  const index = await readIndex();
  index.notes.unshift(id); // 添加到最前面
  await writeIndex(index);

  return note;
}

// 更新笔记
export async function updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note | null> {
  const existingNote = await getNoteById(id);

  if (!existingNote) {
    return null;
  }

  const updatedNote: Note = {
    ...existingNote,
    ...updates,
    id: existingNote.id, // 确保ID不变
    createdAt: existingNote.createdAt, // 确保创建时间不变
    updatedAt: new Date().toISOString(),
  };

  const notePath = path.join(NOTES_BASE_PATH, id, 'note.json');
  await fs.writeFile(notePath, JSON.stringify(updatedNote, null, 2), 'utf-8');

  return updatedNote;
}

// 删除笔记
export async function deleteNote(id: string): Promise<boolean> {
  try {
    // 删除笔记目录
    const noteDir = path.join(NOTES_BASE_PATH, id);
    await fs.rm(noteDir, { recursive: true, force: true });

    // 从索引中移除
    const index = await readIndex();
    index.notes = index.notes.filter(noteId => noteId !== id);
    await writeIndex(index);

    return true;
  } catch (error) {
    console.error(`Error deleting note ${id}:`, error);
    return false;
  }
}

// 搜索笔记（标题、内容、标签）
export async function searchNotes(query: string): Promise<Note[]> {
  const allNotes = await getAllNotes();
  const lowerQuery = query.toLowerCase();

  return allNotes.filter(note =>
    note.title.toLowerCase().includes(lowerQuery) ||
    note.content.toLowerCase().includes(lowerQuery) ||
    note.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    (note.category && note.category.toLowerCase().includes(lowerQuery))
  );
}

// 根据标签获取笔记
export async function getNotesByTag(tag: string): Promise<Note[]> {
  const allNotes = await getAllNotes();
  return allNotes.filter(note =>
    note.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

// 根据分类获取笔记
export async function getNotesByCategory(category: string): Promise<Note[]> {
  const allNotes = await getAllNotes();
  return allNotes.filter(note =>
    note.category?.toLowerCase() === category.toLowerCase()
  );
}
