import { db } from './db';
import fs from 'fs';
import path from 'path';
import { log } from './vite';
import schedule from 'node-schedule';

// สร้างโฟลเดอร์สำหรับเก็บไฟล์ backup
const backupDir = path.join(process.cwd(), 'data_backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// ฟังก์ชันสำหรับ backup ข้อมูลแต่ละตาราง
async function backupTable(tableName: string): Promise<void> {
  try {
    const data = await db.execute(`SELECT * FROM ${tableName}`);
    const backupFilePath = path.join(backupDir, `${tableName}_backup.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2));
    log(`Backed up ${tableName} successfully`, 'backup');
  } catch (error) {
    log(`Error backing up ${tableName}: ${error}`, 'backup');
  }
}

// ฟังก์ชันสำหรับ restore ข้อมูลแต่ละตาราง
async function restoreTable(tableName: string): Promise<void> {
  try {
    const backupFilePath = path.join(backupDir, `${tableName}_backup.json`);
    if (!fs.existsSync(backupFilePath)) {
      log(`No backup file found for ${tableName}`, 'backup');
      return;
    }

    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    if (!backupData || !Array.isArray(backupData)) {
      log(`Invalid backup data for ${tableName}`, 'backup');
      return;
    }

    // เคลียร์ข้อมูลเดิมก่อน (อันนี้อาจจะต้องปรับตามความเหมาะสม)
    await db.execute(`TRUNCATE ${tableName} RESTART IDENTITY CASCADE`);
    
    // ถ้าไม่มีข้อมูลใน backup ก็จบเลย
    if (backupData.length === 0) {
      log(`No data to restore for ${tableName}`, 'backup');
      return;
    }

    // สร้าง columns ทั้งหมด
    const columns = Object.keys(backupData[0]).join(', ');
    
    // ทำการ restore ข้อมูลทีละรายการ
    for (const item of backupData) {
      const values = Object.values(item)
        .map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          return val;
        })
        .join(', ');
      
      await db.execute(`INSERT INTO ${tableName} (${columns}) VALUES (${values})`);
    }
    
    log(`Restored ${tableName} successfully with ${backupData.length} records`, 'backup');
  } catch (error) {
    log(`Error restoring ${tableName}: ${error}`, 'backup');
  }
}

// ฟังก์ชันรวมสำหรับการ backup ทุกตาราง
export async function backupAllData(): Promise<void> {
  log('Starting data backup process...', 'backup');
  
  // รายชื่อตารางทั้งหมดในฐานข้อมูล
  const tables = ['users', 'loans', 'accounts', 'messages', 'notifications', 'withdrawals'];
  
  for (const table of tables) {
    await backupTable(table);
  }
  
  log('Data backup completed', 'backup');
}

// ฟังก์ชันรวมสำหรับการ restore ทุกตาราง
export async function restoreAllData(): Promise<void> {
  log('Starting data restore process...', 'backup');
  
  // รายชื่อตารางทั้งหมดในฐานข้อมูล - เรียงลำดับให้เหมาะสมเพื่อไม่ให้มีปัญหาเรื่อง foreign key
  const tables = ['users', 'accounts', 'loans', 'messages', 'notifications', 'withdrawals'];
  
  for (const table of tables) {
    await restoreTable(table);
  }
  
  log('Data restore completed', 'backup');
}

// ฟังก์ชันสำหรับเริ่มระบบ auto-backup
export function startAutomaticBackup(): void {
  // กำหนดเวลาให้ backup ทุกๆ 1 ชั่วโมง
  const job = schedule.scheduleJob('0 * * * *', async () => {
    log('Running scheduled automatic backup...', 'backup');
    await backupAllData();
  });
  
  // ทำ backup ทันทีเมื่อระบบเริ่มทำงาน
  backupAllData().catch(error => {
    log(`Initial backup error: ${error}`, 'backup');
  });
  
  log('Automatic backup system started', 'backup');
  
  // ตรวจสอบการล้างข้อมูลฐานข้อมูลและทำการ restore
  // ตรวจสอบทุก 30 นาที
  const checkJob = schedule.scheduleJob('*/30 * * * *', async () => {
    try {
      // ตรวจสอบว่าฐานข้อมูลว่างเปล่าหรือไม่
      const usersCount = await db.execute(`SELECT COUNT(*) FROM users`);
      
      if (usersCount[0].count === '0') {
        log('Database appears to be empty, attempting to restore from backup...', 'backup');
        await restoreAllData();
      }
    } catch (error) {
      log(`Database check error: ${error}`, 'backup');
    }
  });
}
