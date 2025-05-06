import { Request, Response } from 'express';
import { backupAllData, restoreAllData } from '../backup-service';
import { log } from '../vite';

// ตรวจสอบว่าเป็น super admin หรือไม่
export const isSuperAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.isAdmin && req.user.adminRole === 'super_admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Super Admin access required" });
};

// Controller สำหรับการ backup ข้อมูลทั้งหมด
export const backupAllDataController = async (req: Request, res: Response) => {
  try {
    await backupAllData();
    res.json({ success: true, message: 'สำรองข้อมูลทั้งหมดแล้ว' });
  } catch (error) {
    log(`Error in backupAllDataController: ${error}`, 'backup');
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสำรองข้อมูล', error: error.message });
  }
};

// Controller สำหรับการ restore ข้อมูลทั้งหมด
export const restoreAllDataController = async (req: Request, res: Response) => {
  try {
    await restoreAllData();
    res.json({ success: true, message: 'กู้คืนข้อมูลทั้งหมดแล้ว' });
  } catch (error) {
    log(`Error in restoreAllDataController: ${error}`, 'backup');
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล', error: error.message });
  }
};
