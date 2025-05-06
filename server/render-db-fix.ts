import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "../shared/schema";

// ตรวจสอบว่ามี DATABASE_URL หรือไม่
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// สร้าง connection pool ด้วยความระมัดระวังเพื่อป้องกันข้อผิดพลาด PGPORT
let connectionConfig: pg.PoolConfig = { connectionString: process.env.DATABASE_URL };

// ถ้ามีการกำหนด PGPORT ให้ตรวจสอบความถูกต้อง
if (process.env.PGPORT) {
  // แปลงเป็นตัวเลขและตรวจสอบให้แน่ใจว่าเป็นค่าที่ถูกต้อง
  const port = parseInt(process.env.PGPORT, 10);
  if (!isNaN(port) && port > 0 && port < 65536) {
    // ถ้ามีการระบุค่า port ที่ถูกต้อง ให้ใช้ค่าการเชื่อมต่อแบบแยกพารามิเตอร์
    connectionConfig = {
      host: process.env.PGHOST,
      port: port,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      // ยังคงเก็บ connectionString ไว้เป็น fallback
      connectionString: process.env.DATABASE_URL,
    };
  } else {
    console.warn('Invalid PGPORT value, falling back to connectionString only');
  }
}

const pool = new pg.Pool(connectionConfig);

// สร้าง drizzle client
export const db = drizzle(pool, { schema });

// ฟังก์ชันสำหรับรัน migrations
export async function runMigrations() {
  try {
    console.log("Running migrations...");
    
    // ตรวจสอบก่อนว่าทำ migration แล้วหรือยัง (เพื่อหลีกเลี่ยง error "relation already exists")
    try {
      const result = await db.execute(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'accounts'
        )`
      );
      
      const tableExists = result[0]?.exists;
      
      if (tableExists) {
        console.log("Tables already exist, skipping migrations");
        return; // ออกจากฟังก์ชันเลยถ้าตารางมีอยู่แล้ว
      }
    } catch (checkError) {
      console.log("Error checking for existing tables, will attempt migration:", checkError);
    }
    
    // ถ้าไม่มีตารางอยู่แล้ว หรือเกิดข้อผิดพลาดในการตรวจสอบ ให้ลอง migrate
    try {
      await migrate(db, { migrationsFolder: "./migrations" });
      console.log("Migrations completed successfully");
    } catch (migrateError: any) {
      // ถ้าเกิด error "relation already exists" ให้ถือว่าไม่เป็นไร
      if (migrateError.code === '42P07') {
        console.log("Tables already exist (from migration error), continuing...");
      } else {
        throw migrateError; // โยนข้อผิดพลาดอื่นๆ ออกไป
      }
    }
  } catch (error) {
    console.error("Error running migrations:", error);
    // ไม่ throw error เพื่อให้แอพทำงานต่อไปได้แม้ migration จะมีปัญหา
    console.log("Continuing despite migration error...");
  }
}
