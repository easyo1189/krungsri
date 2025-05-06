import fs from 'fs';
import path from 'path';
import { log } from './vite';
import { db } from './db';
import schedule from 'node-schedule';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';

// กำหนดโฟลเดอร์สำหรับเก็บข้อมูลสำรอง
const backupDir = path.join(process.cwd(), 'backups');

// สร้างโฟลเดอร์สำรองข้อมูลถ้าไม่มี
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  log(`Created backup directory at ${backupDir}`, 'backup');
}

// ฟังก์ชันสำรองข้อมูลจากตาราง
async function backupTable(tableName: string): Promise<void> {
  try {
    // ดึงข้อมูลจากตาราง - ใช้การดึงข้อมูลแบบพื้นฐาน
    const data = await db.select().from((schema as any)[tableName]
      where: (fields: any, operators: any) => {
        // ดึงข้อมูลที่ไม่ถูกลบ (ถ้ามี is_deleted จะตรวจสอบด้วย)
        if ('is_deleted' in fields) {
          return eq(fields.is_deleted, false);
        }
        return undefined;
      }
    });

    // เขียนไฟล์ข้อมูลสำรอง
    const backupPath = path.join(backupDir, `${tableName}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    log(`Backed up table ${tableName} to ${backupPath}`, 'backup');
  } catch (error) {
    log(`Error backing up table ${tableName}: ${error}`, 'backup');
    throw error;
  }
}

// ฟังก์ชันกู้คืนข้อมูลไปยังตาราง
async function restoreTable(tableName: string): Promise<void> {
  try {
    const backupPath = path.join(backupDir, `${tableName}.json`);
    if (!fs.existsSync(backupPath)) {
      log(`No backup found for table ${tableName}`, 'backup');
      return;
    }

    // อ่านไฟล์ข้อมูลสำรอง
    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    if (data.length === 0) {
      log(`Backup for table ${tableName} is empty, skipping restore`, 'backup');
      return;
    }

    // เคลียร์ข้อมูลเดิมทั้งหมดในตาราง
    await db.delete((schema as any)[tableName]);
    log(`Cleared existing data from table ${tableName}`, 'backup');

    // เพิ่มข้อมูลจากไฟล์สำรอง
    for (const record of data) {
      // ตรวจสอบและแปลงวันที่ให้เป็นอ็อบเจ็คต์ Date
      const cleanedRecord: any = {};
      for (const [key, value] of Object.entries(record)) {
        if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          cleanedRecord[key] = new Date(value);
        } else {
          cleanedRecord[key] = value;
        }
      }

      // เพิ่มข้อมูลกลับเข้าตาราง
      await db.insert((schema as any)[tableName]).values(cleanedRecord);
    }

    log(`Restored ${data.length} records to table ${tableName}`, 'backup');
  } catch (error) {
    log(`Error restoring table ${tableName}: ${error}`, 'backup');
    throw error;
  }
}

// สำรองข้อมูลทั้งหมด
export async function backupAllData(): Promise<void> {
  try {
    log('Starting full database backup', 'backup');
    const tableNames = Object.keys(schema).filter(key => {
      const value = (schema as any)[key];
      return value && value._ && value._.schema; // เช็คว่าเป็นตารางจริงๆ
    });

    for (const tableName of tableNames) {
      await backupTable(tableName);
    }

    // บันทึกเวลาที่สำรองข้อมูลล่าสุด
    const backupInfo = {
      timestamp: new Date().toISOString(),
      tables: tableNames,
      system: {
        platform: process.platform,
        version: process.version,
        env: process.env.NODE_ENV
      }
    };

    fs.writeFileSync(path.join(backupDir, 'backup_info.json'), JSON.stringify(backupInfo, null, 2));
    log('Full database backup completed successfully', 'backup');
  } catch (error) {
    log(`Full database backup failed: ${error}`, 'backup');
    throw error;
  }
}

// กู้คืนข้อมูลทั้งหมด
export async function restoreAllData(): Promise<void> {
  try {
    const backupInfoPath = path.join(backupDir, 'backup_info.json');
    if (!fs.existsSync(backupInfoPath)) {
      log('No backup information found, cannot restore', 'backup');
      return;
    }

    const backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf8'));
    log(`Found backup from ${backupInfo.timestamp}, starting restore`, 'backup');

    for (const tableName of backupInfo.tables) {
      if ((schema as any)[tableName]) {
        await restoreTable(tableName);
      } else {
        log(`Table ${tableName} no longer exists in schema, skipping`, 'backup');
      }
    }

    log('Full database restore completed successfully', 'backup');
  } catch (error) {
    log(`Full database restore failed: ${error}`, 'backup');
    throw error;
  }
}

// เริ่มต้นการสำรองข้อมูลอัตโนมัติ
export function startAutomaticBackup(): void {
  try {
    // กำหนดการสำรองข้อมูลทุกชั่วโมง
    const hourlyBackup = schedule.scheduleJob('0 * * * *', async () => {
      try {
        log('Starting scheduled hourly backup', 'backup');
        await backupAllData();
        log('Scheduled hourly backup completed', 'backup');
      } catch (error) {
        log(`Scheduled hourly backup failed: ${error}`, 'backup');
      }
    });

    // กำหนดการสำรองข้อมูลทุกวันเวลาเที่ยงคืน
    const dailyBackup = schedule.scheduleJob('0 0 * * *', async () => {
      try {
        log('Starting scheduled daily backup', 'backup');
        await backupAllData();
        log('Scheduled daily backup completed', 'backup');
        
        // เก็บรักษาไฟล์สำรองประจำวันไว้บางส่วน
        const dailyDir = path.join(backupDir, `daily_${new Date().toISOString().slice(0, 10)}`);
        if (!fs.existsSync(dailyDir)) {
          fs.mkdirSync(dailyDir, { recursive: true });
        }
        
        // คัดลอกไฟล์สำรองไปยังโฟลเดอร์รายวัน
        const tableNames = Object.keys(schema).filter(key => {
          const value = (schema as any)[key];
          return value && value._ && value._.schema;
        });
        
        for (const tableName of tableNames) {
          const sourcePath = path.join(backupDir, `${tableName}.json`);
          const destPath = path.join(dailyDir, `${tableName}.json`);
          fs.copyFileSync(sourcePath, destPath);
        }
        
        fs.copyFileSync(
          path.join(backupDir, 'backup_info.json'),
          path.join(dailyDir, 'backup_info.json')
        );
        
        log(`Daily backup archived to ${dailyDir}`, 'backup');
      } catch (error) {
        log(`Scheduled daily backup failed: ${error}`, 'backup');
      }
    });

    // สำรองข้อมูลทันทีเพื่อให้มีข้อมูลเริ่มต้น
    backupAllData().then(() => {
      log('Initial backup completed on startup', 'backup');
    }).catch(error => {
      log(`Initial backup failed on startup: ${error}`, 'backup');
    });

    // ทดลองกู้คืนข้อมูลทันทีหากมีไฟล์สำรองข้อมูลอยู่แล้ว
    const backupInfoPath = path.join(backupDir, 'backup_info.json');
    if (fs.existsSync(backupInfoPath)) {
      log('Backup data found, attempting to restore on startup', 'backup');
      restoreAllData().then(() => {
        log('Automatic restore completed on startup', 'backup');
      }).catch(error => {
        log(`Automatic restore failed on startup: ${error}`, 'backup');
      });
    }

    log('Automatic backup system initialized', 'backup');
    return;
  } catch (error) {
    log(`Failed to initialize automatic backup system: ${error}`, 'backup');
    throw error;
  }
}
