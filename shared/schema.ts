import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),  // ทำให้เป็น optional เพื่อรองรับ social login
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  age: integer("age"),
  birthDate: text("birth_date"),
  address: text("address"),
  occupation: text("occupation"),
  monthlyIncome: integer("monthly_income"),
  remainingIncome: integer("remaining_income"),
  idCardNumber: text("id_card_number"),
  profilePicture: text("profile_picture"),
  frontIdCardImage: text("front_id_card_image"),
  backIdCardImage: text("back_id_card_image"),
  selfieWithIdCardImage: text("selfie_with_id_card_image"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  adminRole: text("admin_role"), // 'super_admin', 'admin', null
  adminExpiresAt: timestamp("admin_expires_at"), // เวลาหมดอายุของสิทธิแอดมิน
  assignedByAdminId: integer("assigned_by_admin_id"), // รหัสของแอดมินที่แต่งตั้ง
  canAccessSettings: boolean("can_access_settings").default(false), // สิทธิ์เข้าถึงหน้าตั้งค่า
  isActive: boolean("is_active").default(true).notNull(),
  status: text("status").default("active").notNull(), // active, blocked_withdrawal, blocked_loan
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Social login fields
  googleId: text("google_id").unique(),
  facebookId: text("facebook_id").unique(),
  authProvider: text("auth_provider"), // 'local', 'google', 'facebook'
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at")
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, googleId: true, facebookId: true })
  .extend({
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    authProvider: z.enum(['local', 'google', 'facebook']).optional().default('local'),
  })
  .refine((data) => {
    // ถ้าไม่ใช่ social login ต้องมีรหัสผ่านและรหัสผ่านต้องตรงกัน
    if (data.authProvider === 'local' || !data.authProvider) {
      if (!data.password) return false;
      if (!data.confirmPassword) return false;
      return data.password === data.confirmPassword;
    }
    // social login ไม่จำเป็นต้องมีรหัสผ่าน
    return true;
  }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Loan schema
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  term: integer("term").notNull(), // in months
  interestRate: integer("interest_rate").notNull(), // in basis points (0.01%)
  monthlyPayment: integer("monthly_payment").notNull(),
  purpose: text("purpose"),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, completed
  adminId: integer("admin_id"), // Admin who processed the loan
  adminNote: text("admin_note"),
  // ข้อมูลส่วนตัวของผู้กู้
  fullName: text("full_name"),
  idCardNumber: text("id_card_number"),
  age: integer("age"),
  phone: text("phone"),
  address: text("address"),
  occupation: text("occupation"),
  income: integer("income"), // รายได้ต่อเดือน
  remainingIncome: integer("remaining_income"), // รายได้คงเหลือ
  // รูปภาพเอกสาร
  frontIdCardImage: text("front_id_card_image"),
  backIdCardImage: text("back_id_card_image"),
  selfieWithIdCardImage: text("selfie_with_id_card_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLoanSchema = createInsertSchema(loans)
  .omit({
    id: true,
    adminId: true,
    adminNote: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    amount: z.number().min(50000, "ยอดกู้ขั้นต่ำ 50,000 บาท").max(5000000, "ยอดกู้สูงสุด 5,000,000 บาท"),
    term: z.number().min(1, "ระยะเวลาขั้นต่ำ 1 เดือน").max(60, "ระยะเวลาสูงสุด 60 เดือน"),
  });

// Message schema for chat
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text").notNull(), // text, image, file
  fileUrl: text("file_url"), // URL ของไฟล์หรือรูปภาพ
  fileName: text("file_name"), // ชื่อไฟล์
  fileSize: integer("file_size"), // ขนาดไฟล์ (bytes)
  fileMimeType: text("file_mime_type"), // ประเภทของไฟล์ (MIME type)
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"), // เวลาที่ข้อความถูกอ่าน
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  readAt: true,
  createdAt: true,
});

// Notification schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  type: text("type").notNull(), // loan, chat, system
  relatedEntityId: integer("related_entity_id"), // loan_id or message_id
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Account balance schema
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  balance: integer("balance").default(0).notNull(), // in THB (smallest unit)
  // Bank account details for withdrawals
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  withdrawalCode: text("withdrawal_code"), // Admin-assigned unique withdrawal code
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});

// Bank account schema for users
export const bankAccountSchema = z.object({
  bankName: z.string().min(1, "กรุณาเลือกธนาคาร"),
  accountNumber: z
    .string()
    .min(10, "เลขบัญชีต้องมีอย่างน้อย 10 ตัว")
    .max(15, "เลขบัญชีต้องไม่เกิน 15 ตัว")
    .regex(/^\d+$/, "เลขบัญชีต้องเป็นตัวเลขเท่านั้น"),
  accountName: z
    .string()
    .min(3, "กรุณาระบุชื่อบัญชี"),
});

// Withdrawal schema
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // in THB (smallest unit)
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  adminId: integer("admin_id"), // Admin who processed the withdrawal
  adminNote: text("admin_note"),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  adminId: true,
  adminNote: true,
  createdAt: true,
  updatedAt: true,
});

// Withdrawal form schema - just amount and withdrawal code
export const withdrawalFormSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "กรุณาระบุจำนวนเงิน" })
      .positive("จำนวนเงินต้องเป็นตัวเลขบวก")
      .min(100, "จำนวนเงินขั้นต่ำคือ 100 บาท")
  ),
  withdrawalCode: z
    .string()
    .min(6, "รหัสถอนเงินต้องมีอย่างน้อย 6 ตัว")
    .max(8, "รหัสถอนเงินต้องไม่เกิน 8 ตัว"),
});

// Admin assignment schema
export const adminAssignmentSchema = z.object({
  userId: z.number().positive(),
  adminRole: z.enum(['admin']), // ตอนนี้เราสนับสนุนแค่ 'admin' ธรรมดา เพราะ super_admin ถูกกำหนดตั้งแต่สร้างระบบ
  durationUnit: z.enum(['minutes', 'hours', 'days', 'months', 'years']),
  durationValue: z.number().positive(),
  canAccessSettings: z.boolean().optional().default(false), // สิทธิ์เข้าถึงหน้าตั้งค่า
});

export type AdminAssignment = z.infer<typeof adminAssignmentSchema>;

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = Pick<InsertUser, "username" | "password">;

// withdrawalCode was already defined in users table

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type WithdrawalFormValues = z.infer<typeof withdrawalFormSchema>;
export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;