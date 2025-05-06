import { type User, type InsertUser, type Loan, type InsertLoan, type Message, type InsertMessage, type Notification, type InsertNotification, type Account, type InsertAccount, type Withdrawal, type InsertWithdrawal } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { log } from "./vite";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Initialize memory store
const MemoryStore = createMemoryStore(session);

// Password hashing utilities
const scryptAsync = promisify(scrypt);

// Hash a password for initial admin user
async function hashInitialPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, "confirmPassword">): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Admin operations
  assignAdmin(userId: number, adminRole: string, expiresAt: Date, assignedBy: number, canAccessSettings?: boolean): Promise<User | undefined>;
  revokeAdmin(userId: number): Promise<User | undefined>;
  getAdmins(): Promise<User[]>;

  // Loan operations
  getLoan(id: number): Promise<Loan | undefined>;
  getLoansByUserId(userId: number): Promise<Loan[]>;
  getAllLoans(): Promise<Loan[]>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: number, loan: Partial<Loan>): Promise<Loan | undefined>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  getUserMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;

  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;

  // Account operations
  getAccount(userId: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(userId: number, updates: Partial<Account>): Promise<Account | undefined>;
  updateAccountBalance(userId: number, amount: number): Promise<Account | undefined>;

  // Withdrawal operations
  getWithdrawal(id: number): Promise<Withdrawal | undefined>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;
  getAllWithdrawals(): Promise<Withdrawal[]>;
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  updateWithdrawal(id: number, withdrawal: Partial<Withdrawal>): Promise<Withdrawal | undefined>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private usersStore: Map<number, User>;
  private loansStore: Map<number, Loan>;
  private messagesStore: Map<number, Message>;
  private notificationsStore: Map<number, Notification>;
  private accountsStore: Map<number, Account>;
  private withdrawalsStore: Map<number, Withdrawal>;

  private userIdCounter: number;
  private loanIdCounter: number;
  private messageIdCounter: number;
  private notificationIdCounter: number;
  private withdrawalIdCounter: number;

  sessionStore: session.Store;

  constructor() {
    // Initialize stores
    this.usersStore = new Map();
    this.loansStore = new Map();
    this.messagesStore = new Map();
    this.notificationsStore = new Map();
    this.accountsStore = new Map();
    this.withdrawalsStore = new Map();

    // Initialize ID counters
    this.userIdCounter = 1;
    this.loanIdCounter = 1;
    this.messageIdCounter = 1;
    this.notificationIdCounter = 1;
    this.withdrawalIdCounter = 1;

    // Create session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every 24h
    });

    // Initialize with admin user
    hashInitialPassword("admin123").then(hashedPassword => {
      this.createUser({
        username: "admin",
        password: hashedPassword,
        email: "admin@cashluxe.com",
        fullName: "System Administrator",
        phone: "099-999-9999",
        authProvider: 'local',
        isAdmin: true,
        adminRole: 'super_admin', // กำหนดให้เป็น super_admin
        isActive: true,
        address: '123/456 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
        occupation: 'พนักงานบริษัท',
        monthlyIncome: 45000,
        remainingIncome: 15000,
        idCardNumber: '1234567890123',
        age: 35,
        frontIdCardImage: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_krungsri@2x.png',
        backIdCardImage: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_krungsri@2x.png',
        selfieWithIdCardImage: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_krungsri@2x.png',
      }).then(admin => {
        log(`Admin user created with ID: ${admin.id}`, "storage");
        
        // สร้างบัญชีเงินสำหรับ admin
        this.createAccount({
          userId: admin.id,
          balance: 0,
          bankName: 'กรุงศรี',
          accountNumber: '1234567890',
          accountName: 'System Administrator',
        }).then(() => {
          log(`Admin account created successfully`, "storage");
        });
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersStore.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.googleId === googleId
    );
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.facebookId === facebookId
    );
  }

  async createUser(insertUser: Omit<InsertUser, "confirmPassword">): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Set default values
    const authProvider = insertUser.authProvider || 'local';
    
    const user: User = {
      ...insertUser,
      id,
      createdAt: now,
      isActive: true,
      isAdmin: insertUser.isAdmin || false,
      authProvider,
      password: insertUser.password || null,
      googleId: (insertUser as any).googleId || null,
      facebookId: (insertUser as any).facebookId || null,
      birthDate: insertUser.birthDate || null,
      address: insertUser.username === 'admin' ? '123/456 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110' : (insertUser.address || null),
      occupation: insertUser.username === 'admin' ? 'พนักงานบริษัท' : (insertUser.occupation || null),
      monthlyIncome: insertUser.username === 'admin' ? 45000 : (insertUser.monthlyIncome || null),
      remainingIncome: insertUser.username === 'admin' ? 15000 : (insertUser.remainingIncome || null),
      idCardNumber: insertUser.username === 'admin' ? '1234567890123' : (insertUser.idCardNumber || null),
      age: insertUser.username === 'admin' ? 35 : (insertUser.age || null),
      frontIdCardImage: insertUser.frontIdCardImage || null,
      backIdCardImage: insertUser.backIdCardImage || null,
      selfieWithIdCardImage: insertUser.selfieWithIdCardImage || null,
      profilePicture: insertUser.profilePicture || null
    };
    this.usersStore.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.usersStore.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersStore.values());
  }
  
  // Admin operations
  async assignAdmin(userId: number, adminRole: string, expiresAt: Date, assignedBy: number, canAccessSettings: boolean = false): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // ตรวจสอบว่าผู้ที่แต่งตั้งเป็น super_admin หรือไม่
    const assigningUser = await this.getUser(assignedBy);
    if (!assigningUser || assigningUser.adminRole !== 'super_admin') {
      throw new Error('Only super admin can assign admin roles');
    }
    
    // อัพเดทสถานะแอดมิน
    const updatedUser = { 
      ...user, 
      isAdmin: true,
      adminRole,
      adminExpiresAt: expiresAt,
      assignedByAdminId: assignedBy,
      canAccessSettings: canAccessSettings
    };
    
    this.usersStore.set(userId, updatedUser);
    return updatedUser;
  }
  
  async revokeAdmin(userId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // ไม่สามารถยกเลิกสิทธิ์ super_admin ได้
    if (user.adminRole === 'super_admin') {
      throw new Error('Cannot revoke super admin privileges');
    }
    
    // ยกเลิกสิทธิ์แอดมิน
    const updatedUser = { 
      ...user, 
      isAdmin: false,
      adminRole: null,
      adminExpiresAt: null,
      assignedByAdminId: null,
      canAccessSettings: false
    };
    
    this.usersStore.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getAdmins(): Promise<User[]> {
    return Array.from(this.usersStore.values())
      .filter(user => user.isAdmin);
  }

  // Loan methods
  async getLoan(id: number): Promise<Loan | undefined> {
    return this.loansStore.get(id);
  }

  async getLoansByUserId(userId: number): Promise<Loan[]> {
    return Array.from(this.loansStore.values()).filter(
      (loan) => loan.userId === userId
    );
  }

  async getAllLoans(): Promise<Loan[]> {
    return Array.from(this.loansStore.values());
  }

  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const id = this.loanIdCounter++;
    const now = new Date();
    const loan: Loan = {
      ...insertLoan,
      id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      adminId: null,
      adminNote: null,
      purpose: insertLoan.purpose || null,
      idCardDocument: insertLoan.idCardDocument || null,
      salaryDocument: insertLoan.salaryDocument || null
    };
    this.loansStore.set(id, loan);
    return loan;
  }

  async updateLoan(id: number, updates: Partial<Loan>): Promise<Loan | undefined> {
    const loan = await this.getLoan(id);
    if (!loan) return undefined;

    const updatedLoan = {
      ...loan,
      ...updates,
      updatedAt: new Date()
    };
    this.loansStore.set(id, updatedLoan);
    return updatedLoan;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messagesStore.get(id);
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messagesStore.values())
      .filter(message =>
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messagesStore.values())
      .filter(message =>
        message.senderId === userId || message.receiverId === userId
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      isRead: false,
      createdAt: now
    };
    this.messagesStore.set(id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = await this.getMessage(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, isRead: true };
    this.messagesStore.set(id, updatedMessage);
    return updatedMessage;
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationsStore.get(id);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notificationsStore.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt: now,
      relatedEntityId: insertNotification.relatedEntityId || null
    };
    this.notificationsStore.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = await this.getNotification(id);
    if (!notification) return undefined;

    const updatedNotification = { ...notification, isRead: true };
    this.notificationsStore.set(id, updatedNotification);
    return updatedNotification;
  }

  // Account methods
  async getAccount(userId: number): Promise<Account | undefined> {
    // Find account by userId
    return Array.from(this.accountsStore.values()).find(
      (account) => account.userId === userId
    );
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.userIdCounter++; // Using a new counter could be better
    const now = new Date();
    const account: Account = {
      ...insertAccount,
      id,
      balance: insertAccount.balance || 0,
      bankName: insertAccount.bankName || null,
      accountNumber: insertAccount.accountNumber || null,
      accountName: insertAccount.accountName || null,
      withdrawalCode: insertAccount.withdrawalCode || null,
      createdAt: now,
      updatedAt: now
    };
    this.accountsStore.set(id, account);
    return account;
  }
  
  async updateAccount(userId: number, updates: Partial<Account>): Promise<Account | undefined> {
    let account = await this.getAccount(userId);
    
    if (!account) {
      return undefined;
    }
    
    const updatedAccount = {
      ...account,
      ...updates,
      updatedAt: new Date()
    };
    this.accountsStore.set(account.id, updatedAccount);
    return updatedAccount;
  }

  async updateAccountBalance(userId: number, amount: number): Promise<Account | undefined> {
    let account = await this.getAccount(userId);

    // If account doesn't exist, create a new one
    if (!account) {
      account = await this.createAccount({ userId, balance: 0 });
    }

    // Update balance
    const updatedAccount = {
      ...account,
      balance: account.balance + amount,
      updatedAt: new Date()
    };
    this.accountsStore.set(account.id, updatedAccount);
    return updatedAccount;
  }

  // Withdrawal methods
  async getWithdrawal(id: number): Promise<Withdrawal | undefined> {
    return this.withdrawalsStore.get(id);
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return Array.from(this.withdrawalsStore.values())
      .filter(withdrawal => withdrawal.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return Array.from(this.withdrawalsStore.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }

  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const id = this.withdrawalIdCounter++;
    const now = new Date();
    const withdrawal: Withdrawal = {
      ...insertWithdrawal,
      id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      adminId: null,
      adminNote: null
    };
    this.withdrawalsStore.set(id, withdrawal);

    // Deduct balance from user account temporarily
    const account = await this.getAccount(insertWithdrawal.userId);
    if (account && account.balance >= insertWithdrawal.amount) {
      await this.updateAccountBalance(insertWithdrawal.userId, -insertWithdrawal.amount);
    }

    return withdrawal;
  }

  async updateWithdrawal(id: number, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const withdrawal = await this.getWithdrawal(id);
    if (!withdrawal) return undefined;

    // If status is changing to rejected, refund the money
    if (updates.status === "rejected" && withdrawal.status !== "rejected") {
      await this.updateAccountBalance(withdrawal.userId, withdrawal.amount);
    }

    const updatedWithdrawal = {
      ...withdrawal,
      ...updates,
      updatedAt: new Date()
    };
    this.withdrawalsStore.set(id, updatedWithdrawal);
    return updatedWithdrawal;
  }
}

// Export Memory storage instead of PostgreSQL
export const storage = new MemStorage();