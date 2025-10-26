import { Request, Response } from 'express';
import * as noteService from '../services/noteService.js';

// 获取所有笔记
export async function getAllNotes(req: Request, res: Response): Promise<void> {
  try {
    const notes = await noteService.getAllNotes();
    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error('Error getting all notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notes',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 根据ID获取笔记
export async function getNoteById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const note = await noteService.getNoteById(id);

    if (!note) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      });
      return;
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error('Error getting note by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get note',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 创建新笔记
export async function createNote(req: Request, res: Response): Promise<void> {
  try {
    const { title, content, tags, category } = req.body;

    // 验证必填字段
    if (!title || typeof title !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Title is required and must be a string',
      });
      return;
    }

    const noteData = {
      title: title.trim(),
      content: content || '',
      tags: Array.isArray(tags) ? tags : [],
      category: category || undefined,
    };

    const note = await noteService.createNote(noteData);

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 更新笔记
export async function updateNote(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, content, tags, category } = req.body;

    const updates: any = {};

    if (title !== undefined) {
      updates.title = title;
    }
    if (content !== undefined) {
      updates.content = content;
    }
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : [];
    }
    if (category !== undefined) {
      updates.category = category;
    }

    const updatedNote = await noteService.updateNote(id, updates);

    if (!updatedNote) {
      res.status(404).json({
        success: false,
        error: 'Note not found',
      });
      return;
    }

    res.json({
      success: true,
      data: updatedNote,
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 删除笔记
export async function deleteNote(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const success = await noteService.deleteNote(id);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Note not found or failed to delete',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 搜索笔记
export async function searchNotes(req: Request, res: Response): Promise<void> {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
      return;
    }

    const notes = await noteService.searchNotes(q);

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search notes',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 根据标签获取笔记
export async function getNotesByTag(req: Request, res: Response): Promise<void> {
  try {
    const { tag } = req.params;
    const notes = await noteService.getNotesByTag(tag);

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error('Error getting notes by tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notes by tag',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 根据分类获取笔记
export async function getNotesByCategory(req: Request, res: Response): Promise<void> {
  try {
    const { category } = req.params;
    const notes = await noteService.getNotesByCategory(category);

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error('Error getting notes by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notes by category',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 同步索引
export async function syncIndex(req: Request, res: Response): Promise<void> {
  try {
    const index = await noteService.syncIndexFromFileSystem();

    res.json({
      success: true,
      data: index,
    });
  } catch (error) {
    console.error('Error syncing index:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync index',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
