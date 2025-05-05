import express from 'express';
import type { Request, Response } from 'express';
import { log } from '../vite';
import { db } from '../db';

const router = express.Router();

// Middleware to check if user is super admin (copied from routes.ts)
const isSuperAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.isAdmin && req.user.adminRole === 'super_admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Super Admin access required" });
};

// API สำหรับกู้คืนข้อมูลทั้งหมดที่ถูกมาร์คว่าลบ
router.post('/api/admin/restore/all', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    await db.execute(`SELECT restore_all_deleted_data()`);
    res.json({ success: true, message: 'ข้อมูลทั้งหมดถูกกู้คืนเรียบร้อยแล้ว' });
  } catch (error) {
    log(`Error restoring all data: ${error}`, 'api');
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล', error: error.message });
  }
});

// API สำหรับกู้คืนข้อมูลผู้ใช้ทั้งหมดที่ถูกมาร์คว่าลบ
router.post('/api/admin/restore/users', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    await db.execute(`SELECT restore_deleted_users()`);
    res.json({ success: true, message: 'ข้อมูลผู้ใช้ทั้งหมดถูกกู้คืนเรียบร้อยแล้ว' });
  } catch (error) {
    log(`Error restoring users: ${error}`, 'api');
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการกู้คืนข้อมูลผู้ใช้', error: error.message });
  }
});

// API สำหรับกู้คืนข้อมูลสินเชื่อทั้งหมดที่ถูกมาร์คว่าลบ
router.post('/api/admin/restore/loans', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    await db.execute(`SELECT restore_deleted_loans()`);
    res.json({ success: true, message: 'ข้อมูลสินเชื่อทั้งหมดถูกกู้คืนเรียบร้อยแล้ว' });
  } catch (error) {
    log(`Error restoring loans: ${error}`, 'api');
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการกู้คืนข้อมูลสินเชื่อ', error: error.message });
  }
});

// API สำหรับกู้คืนข้อมูลข้อความทั้งหมดที่ถูกมาร์คว่าลบ
router.post('/api/admin/restore/messages', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    await db.execute(`SELECT restore_deleted_messages()`);
    res.json({ success: true, message: 'ข้อมูลข้อความทั้งหมดถูกกู้คืนเรียบร้อยแล้ว' });
  } catch (error) {
    log(`Error restoring messages: ${error}`, 'api');
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการกู้คืนข้อมูลข้อความ', error: error.message });
  }
});

// API สำหรับกู้คืนข้อมูลการถอนเงินทั้งหมดที่ถูกมาร์คว่าลบ
router.post('/api/admin/restore/withdrawals', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    await db.execute(`SELECT restore_deleted_withdrawals()`);
    res.json({ success: true, message: 'ข้อมูลการถอนเงินทั้งหมดถูกกู้คืนเรียบร้อยแล้ว' });
  } catch (error) {
    log(`Error restoring withdrawals: ${error}`, 'api');
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการกู้คืนข้อมูลการถอนเงิน', error: error.message });
  }
});

// API สำหรับกู้คืนข้อมูลผู้ใช้รายบุคคลตาม ID
router.post('/api/admin/restore/user/:id', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'รหัสผู้ใช้ไม่ถูกต้อง' });
    }
    
    await db.execute(`SELECT restore_user_by_id($1)`, [userId]);
    res.json({ success: true, message: `ข้อมูลผู้ใช้ ID ${userId} ถูกกู้คืนเรียบร้อยแล้ว` });
  } catch (error) {
    log(`Error restoring user: ${error}`, 'api');
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการกู้คืนข้อมูลผู้ใช้', error: error.message });
  }
});

// API สำหรับดูจำนวนข้อมูลที่ถูกมาร์คว่าลบทั้งหมด
router.get('/api/admin/deleted-count', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await db.execute(`SELECT * FROM get_all_deleted_data_count()`);
    res.json(result);
  } catch (error) {
    log(`Error getting deleted data count: ${error}`, 'api');
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลจำนวนข้อมูลที่ถูกลบ', error: error.message });
  }
});

// API สำหรับดูรายชื่อผู้ใช้ที่ถูกมาร์คว่าลบ
router.get('/api/admin/deleted-users', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const result = await db.execute(`SELECT * FROM get_deleted_users()`);
    res.json(result);
  } catch (error) {
    log(`Error getting deleted users: ${error}`, 'api');
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ที่ถูกลบ', error: error.message });
  }
});

export default router;