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
import { eq, and, or, desc, isNull } from "drizzle-orm";
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
      const adminUser = await db.select().from(users)
        .where(and(
          eq(users.isAdmin, true),
          eq(users.is_deleted, false)
        )).limit(1);
      
      if (adminUser.length === 0) {
        // สร้าง admin user
        const hashedPassword = await hashPassword("admin123");
        
        const [admin] = await db.insert(users).values({
          username: "admin",
          password: hashedPassword,
          email: "admin@example.com",
          fullName: "System Admin",
          phone: "0987654321",
          isAdmin: true,
          adminRole: 'super_admin',
          canAccessSettings: true,
          isActive: true,
          is_deleted: false
        }).returning();
        
        log(`Admin user created with ID: ${admin.id}`, "storage");

        // สร้างบัญชีเงินให้ admin
        await db.insert(accounts).values({
          userId: admin.id,
          balance: 1000000,
          bankName: "Test Bank",
          accountNumber: "1234567890",
          accountName: "System Admin",
          withdrawalCode: "ADMIN123"
        });

        log("Admin account created successfully", "storage");
      }
    } catch (error) {
      log(`Failed to initialize admin user: ${error}`, "storage");
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(
        eq(users.id, id),
        eq(users.is_deleted, false)
      ));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(
        eq(users.username, username),
        eq(users.is_deleted, false)
      ));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(
        eq(users.email, email),
        eq(users.is_deleted, false)
      ));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(
        eq(users.googleId, googleId),
        eq(users.is_deleted, false)
      ));
    return user;
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(
        eq(users.facebookId, facebookId),
        eq(users.is_deleted, false)
      ));
    return user;
  }

  async createUser(insertUser: Omit<InsertUser, "confirmPassword">): Promise<User> {
    // ถ้ามีรหัสผ่าน ให้ hash ก่อน
    if (insertUser.password) {
      insertUser.password = await hashPassword(insertUser.password);
    }
    
    // กำหนดค่า is_deleted เป็น false
    const values = { ...insertUser, is_deleted: false };
    
    const [user] = await db.insert(users).values(values).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    // ถ้ามีการอัพเดทรหัสผ่าน ให้ hash ก่อน
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }
    
    const result = await db.update(users)
      .set(updates)
      .where(and(
        eq(users.id, id),
        eq(users.is_deleted, false)
      ))
      .returning();
    
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.is_deleted, false))
      .orderBy(users.createdAt);
  }

  // Admin operations
  async assignAdmin(userId: number, adminRole: string, expiresAt: Date, assignedBy: number, canAccessSettings: boolean = false): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        isAdmin: true,
        adminRole,
        adminExpiresAt: expiresAt,
        assignedByAdminId: assignedBy,
        canAccessSettings
      })
      .where(and(
        eq(users.id, userId),
        eq(users.is_deleted, false)
      ))
      .returning();
    
    return result[0];
  }

  async revokeAdmin(userId: number): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        isAdmin: false,
        adminRole: null,
        adminExpiresAt: null,
        assignedByAdminId: null,
        canAccessSettings: false
      })
      .where(and(
        eq(users.id, userId),
        eq(users.is_deleted, false)
      ))
      .returning();
    
    return result[0];
  }

  async getAdmins(): Promise<User[]> {
    return await db.select().from(users)
      .where(and(
        eq(users.isAdmin, true),
        eq(users.is_deleted, false)
      ))
      .orderBy(users.createdAt);
  }

  // Loan operations
  async getLoan(id: number): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans)
      .where(and(
        eq(loans.id, id),
        eq(loans.is_deleted, false)
      ));
    return loan;
  }

  async getLoansByUserId(userId: number): Promise<Loan[]> {
    return await db.select().from(loans)
      .where(and(
        eq(loans.userId, userId),
        eq(loans.is_deleted, false)
      ))
      .orderBy(desc(loans.createdAt));
  }

  async getAllLoans(): Promise<Loan[]> {
    return await db.select().from(loans)
      .where(eq(loans.is_deleted, false))
      .orderBy(desc(loans.createdAt));
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    // กำหนดค่า is_deleted เป็น false
    const values = { ...loan, is_deleted: false };
    
    const [result] = await db.insert(loans).values(values).returning();
    return result;
  }

  async updateLoan(id: number, updates: Partial<Loan>): Promise<Loan | undefined> {
    const result = await db.update(loans)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(loans.id, id),
        eq(loans.is_deleted, false)
      ))
      .returning();
    
    return result[0];
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages)
      .where(and(
        eq(messages.id, id),
        eq(messages.is_deleted, false)
      ));
    return message;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(and(
        or(
          and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
          and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
        ),
        eq(messages.is_deleted, false)
      ))
      .orderBy(messages.createdAt);
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(and(
        or(eq(messages.senderId, userId), eq(messages.receiverId, userId)),
        eq(messages.is_deleted, false)
      ))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    // กำหนดค่า is_deleted เป็น false
    const values = { ...message, is_deleted: false };
    
    const [result] = await db.insert(messages).values(values).returning();
    return result;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const now = new Date();
    const result = await db.update(messages)
      .set({
        isRead: true,
        readAt: now
      })
      .where(and(
        eq(messages.id, id),
        eq(messages.is_deleted, false)
      ))
      .returning();
    
    return result[0];
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.is_deleted, false)
      ));
    return notification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.is_deleted, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    // กำหนดค่า is_deleted เป็น false
    const values = { ...notification, is_deleted: false };
    
    const [result] = await db.insert(notifications).values(values).returning();
    return result;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.is_deleted, false)
      ))
      .returning();
    
    return result[0];
  }

  // Account operations
  async getAccount(userId: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts)
      .where(and(
        eq(accounts.userId, userId),
        eq(accounts.is_deleted, false)
      ));
    return account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    // กำหนดค่า is_deleted เป็น false
    const values = { ...account, is_deleted: false };
    
    const [result] = await db.insert(accounts).values(values).returning();
    return result;
  }

  async updateAccount(userId: number, updates: Partial<Account>): Promise<Account | undefined> {
    const result = await db.update(accounts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(accounts.userId, userId),
        eq(accounts.is_deleted, false)
      ))
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
      .where(and(
        eq(accounts.userId, userId),
        eq(accounts.is_deleted, false)
      ))
      .returning();
    
    return result[0];
  }

  // Withdrawal operations
  async getWithdrawal(id: number): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals)
      .where(and(
        eq(withdrawals.id, id),
        eq(withdrawals.is_deleted, false)
      ));
    return withdrawal;
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals)
      .where(and(
        eq(withdrawals.userId, userId),
        eq(withdrawals.is_deleted, false)
      ))
      .orderBy(desc(withdrawals.createdAt));
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals)
      .where(eq(withdrawals.is_deleted, false))
      .orderBy(desc(withdrawals.createdAt));
  }

  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    // กำหนดค่า is_deleted เป็น false
    const values = { ...withdrawal, is_deleted: false };
    
    const [result] = await db.insert(withdrawals).values(values).returning();
    return result;
  }

  async updateWithdrawal(id: number, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const result = await db.update(withdrawals)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(withdrawals.id, id),
        eq(withdrawals.is_deleted, false)
      ))
      .returning();
    
    return result[0];
  }
  
  // Delete operations (soft delete)
  async softDeleteUser(id: number): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        is_deleted: true,
        deleted_at: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async softDeleteLoan(id: number): Promise<Loan | undefined> {
    const result = await db.update(loans)
      .set({
        is_deleted: true,
        deleted_at: new Date()
      })
      .where(eq(loans.id, id))
      .returning();
    
    return result[0];
  }
  
  async softDeleteMessage(id: number): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({
        is_deleted: true,
        deleted_at: new Date()
      })
      .where(eq(messages.id, id))
      .returning();
    
    return result[0];
  }
  
  async softDeleteNotification(id: number): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({
        is_deleted: true,
        deleted_at: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();
    
    return result[0];
  }
  
  async softDeleteAccount(userId: number): Promise<Account | undefined> {
    const result = await db.update(accounts)
      .set({
        is_deleted: true,
        deleted_at: new Date()
      })
      .where(eq(accounts.userId, userId))
      .returning();
    
    return result[0];
  }
  
  async softDeleteWithdrawal(id: number): Promise<Withdrawal | undefined> {
    const result = await db.update(withdrawals)
      .set({
        is_deleted: true,
        deleted_at: new Date()
      })
      .where(eq(withdrawals.id, id))
      .returning();
    
    return result[0];
  }
}

export const pgStorage = new PgStorage();
