import { 
  users, type User, type InsertUser,
  loans, type Loan, type InsertLoan,
  messages, type Message, type InsertMessage,
  notifications, type Notification, type InsertNotification,
  accounts, type Account, type InsertAccount,
  withdrawals, type Withdrawal, type InsertWithdrawal
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pg from "pg";
import { eq, and, or, desc } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { log } from "./vite";

// แปลง scrypt เป็น Promise-based
const scryptAsync = promisify(scrypt);

// สร้าง hash สำหรับรหัสผ่าน
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export class PgStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // สร้าง session store สำหรับ PostgreSQL
    const PgStore = pgSession(session);
    this.sessionStore = new PgStore({
      pool: new pg.Pool({
        connectionString: process.env.DATABASE_URL,
      }),
      createTableIfMissing: true,
    });

    // สร้าง admin user หากยังไม่มี
    this.initializeAdminUser();
  }

  private async initializeAdminUser() {
    try {
      // ตรวจสอบว่ามี admin user หรือยัง
      const adminUser = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
      
      if (adminUser.length === 0) {
        // สร้าง admin user
        const hashedPassword = await hashPassword("admin123");
        
        await db.insert(users).values({
          username: "admin",
          password: hashedPassword,
          email: "admin@example.com",
          fullName: "System Admin",
          phone: "0987654321",
          isAdmin: true,
        });
        
        log("Admin user created successfully", "storage");
      }
    } catch (error) {
      log(`Error initializing admin user: ${error}`, "storage");
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId!, googleId)).limit(1);
    return result[0];
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.facebookId!, facebookId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: Omit<InsertUser, "confirmPassword">): Promise<User> {
    // ถ้ามีรหัสผ่าน ให้แฮชรหัสผ่านก่อน
    if (insertUser.password) {
      insertUser.password = await hashPassword(insertUser.password);
    }

    const result = await db.insert(users).values(insertUser).returning();
    
    // สร้างบัญชีสำหรับผู้ใช้ใหม่อัตโนมัติ
    await this.createAccount({ userId: result[0].id, balance: 0 });
    
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Loan operations
  async getLoan(id: number): Promise<Loan | undefined> {
    const result = await db.select().from(loans).where(eq(loans.id, id)).limit(1);
    return result[0];
  }

  async getLoansByUserId(userId: number): Promise<Loan[]> {
    return await db.select()
      .from(loans)
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt));
  }

  async getAllLoans(): Promise<Loan[]> {
    return await db.select().from(loans).orderBy(desc(loans.createdAt));
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const result = await db.insert(loans).values(loan).returning();
    return result[0];
  }

  async updateLoan(id: number, updates: Partial<Loan>): Promise<Loan | undefined> {
    const result = await db.update(loans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(loans.id, id))
      .returning();
    
    return result[0];
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return result[0];
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(messages.createdAt);
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    
    return result[0];
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return result[0];
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    
    return result[0];
  }

  // Account operations
  async getAccount(userId: number): Promise<Account | undefined> {
    const result = await db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1);
    return result[0];
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const result = await db.insert(accounts).values(account).returning();
    return result[0];
  }

  async updateAccount(userId: number, updates: Partial<Account>): Promise<Account | undefined> {
    // ดึงข้อมูลบัญชีเดิม
    const existingAccount = await this.getAccount(userId);
    
    if (!existingAccount) {
      return undefined;
    }
    
    // อัพเดทบัญชี
    const result = await db.update(accounts)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(accounts.userId, userId))
      .returning();
    
    return result[0];
  }

  async updateAccountBalance(userId: number, amount: number): Promise<Account | undefined> {
    // ดึงข้อมูลบัญชีเดิม
    const existingAccount = await this.getAccount(userId);
    
    if (!existingAccount) {
      return undefined;
    }

    // คำนวณยอดเงินใหม่
    const newBalance = existingAccount.balance + amount;
    
    // อัพเดทบัญชี
    const result = await db.update(accounts)
      .set({ 
        balance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(accounts.userId, userId))
      .returning();
    
    return result[0];
  }

  // Withdrawal operations
  async getWithdrawal(id: number): Promise<Withdrawal | undefined> {
    const result = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
    return result[0];
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await db.select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt));
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
  }

  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const result = await db.insert(withdrawals).values(withdrawal).returning();
    return result[0];
  }

  async updateWithdrawal(id: number, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const result = await db.update(withdrawals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(withdrawals.id, id))
      .returning();
    
    return result[0];
  }
}