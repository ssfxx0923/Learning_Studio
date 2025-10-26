import { Router } from 'express';
import * as noteController from '../controllers/noteController.js';

const router = Router();

// 获取所有笔记
router.get('/', noteController.getAllNotes);

// 搜索笔记
router.get('/search', noteController.searchNotes);

// 根据标签获取笔记
router.get('/tag/:tag', noteController.getNotesByTag);

// 根据分类获取笔记
router.get('/category/:category', noteController.getNotesByCategory);

// 同步索引
router.post('/sync-index', noteController.syncIndex);

// 根据ID获取笔记
router.get('/:id', noteController.getNoteById);

// 创建新笔记
router.post('/', noteController.createNote);

// 更新笔记
router.put('/:id', noteController.updateNote);

// 删除笔记
router.delete('/:id', noteController.deleteNote);

export default router;
