import express, { Request, Response } from "express";
import { storage } from "../storage";

const router = express.Router();

// ฟังก์ชันดึงข้อมูลทั้งหมดของผู้ใช้รายเดียวหรือทั้งหมด
router.get("/api/admin/all-user-data/:userId?", async (req: Request, res: Response) => {
  try {
    // ตรวจสอบว่าผู้ใช้เป็นแอดมินหรือไม่
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    const userId = req.params.userId ? parseInt(req.params.userId) : undefined;
    
    if (userId) {
      // กรณีระบุ userId มา - ดึงข้อมูลของผู้ใช้คนเดียว
      const userData = await getUserAllData(userId);
      
      if (!userData.user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(userData);
    } else {
      // กรณีไม่ระบุ userId - ดึงข้อมูลของผู้ใช้ทั้งหมด
      const users = await storage.getAllUsers();
      const usersData = await Promise.all(
        users.map(async (user) => await getUserAllData(user.id))
      );
      
      return res.json(usersData);
    }
  } catch (error) {
    console.error("Error fetching all user data:", error);
    res.status(500).json({ 
      message: "An error occurred while fetching user data",
      error: error.message
    });
  }
});

async function getUserAllData(userId: number) {
  try {
    // ดึงข้อมูลส่วนตัวของผู้ใช้
    const user = await storage.getUser(userId);
    
    if (!user) {
      return { user: null };
    }
    
    // ดึงข้อมูลเงินกู้ของผู้ใช้
    const loans = await storage.getLoansByUserId(userId);
    
    // ดึงข้อมูลบัญชีของผู้ใช้
    const account = await storage.getAccount(userId);
    
    // ดึงข้อมูลการถอนเงินของผู้ใช้
    const withdrawals = await storage.getUserWithdrawals(userId);

    // ดึงข้อมูลแจ้งเตือนของผู้ใช้
    const notifications = await storage.getUserNotifications(userId);
    
    return {
      user,
      loans,
      account,
      withdrawals,
      notifications
    };
  } catch (error) {
    console.error(`Error fetching data for user ${userId}:`, error);
    throw error;
  }
}

export default router;