import express from 'express';
import { backupAllDataController, isSuperAdmin, restoreAllDataController } from './controllers/backup-controller';

const router = express.Router();

// API เพื่อการสำรองข้อมูลทั้งหมด
router.post('/api/admin/backup/all', isSuperAdmin, backupAllDataController);

// API เพื่อการกู้คืนข้อมูลทั้งหมด
router.post('/api/admin/restore/all', isSuperAdmin, restoreAllDataController);

// API เพื่อการกู้คืนข้อมูลทั้งหมดสำหรับผู้ไม่ได้เป็น admin (เช่น webhook จาก Render)
router.post('/api/system/restore/emergency', async (req, res) => {
  // ตรวจสอบ secret key ที่ส่งมาพร้อมกับคำขอ
  const secretKey = req.body.secret_key;
  const systemRestoreKey = process.env.SYSTEM_RESTORE_KEY || 'cashluxe-emergency-restore-key';
  
  if (secretKey !== systemRestoreKey) {
    return res.status(403).json({ success: false, message: 'Invalid secret key' });
  }
  
  try {
    // เรียกใช้ฟังก์ชัน restore ข้อมูล
    const { restoreAllData } = require('./backup-service');
    await restoreAllData();
    res.json({ success: true, message: 'Emergency data restore completed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: `Emergency restore failed: ${error.message}` });
  }
});

export default router;