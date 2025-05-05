import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { Account, insertLoanSchema, insertMessageSchema, insertNotificationSchema, insertWithdrawalSchema, User } from "@shared/schema";
import { z } from "zod";
import { log } from "./vite";
import WebSocket from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import adminDataRoutes from "./routes/admin-data";
import restoreDataRoutes from "./routes/restore-data";

// Set up multer storage
const uploadDir = path.join(process.cwd(), 'uploads');
// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage2 });

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    // ตรวจสอบระยะเวลาการเป็นแอดมิน (ถ้ามี) และหมดอายุหรือยัง
    if (req.user.adminExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(req.user.adminExpiresAt);
      
      if (now > expiresAt) {
        return res.status(403).json({ message: "Forbidden: Admin privileges have expired" });
      }
    }
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
};

// Middleware to check if user is a super admin
const isSuperAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.isAdmin && req.user.adminRole === 'super_admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Super Admin access required" });
};

// Middleware to check if user is limited admin with some restrictions
const isLimitedAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    // ตรวจสอบระยะเวลาการเป็นแอดมิน (ถ้ามี) และหมดอายุหรือยัง
    if (req.user.adminExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(req.user.adminExpiresAt);
      
      if (now > expiresAt) {
        return res.status(403).json({ message: "Forbidden: Admin privileges have expired" });
      }
    }
    
    // อนุญาตให้ผ่านไม่ว่าจะเป็น super_admin หรือ admin ทั่วไป
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
};

// Middleware to check if user has access to settings pages
const hasSettingsAccess = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && 
      req.user.isAdmin && 
      (req.user.adminRole === 'super_admin' || req.user.canAccessSettings)) {
    
    // ตรวจสอบระยะเวลาการเป็นแอดมิน (ถ้ามี) และหมดอายุหรือยัง
    if (req.user.adminExpiresAt && req.user.adminRole !== 'super_admin') {
      const now = new Date();
      const expiresAt = new Date(req.user.adminExpiresAt);
      
      if (now > expiresAt) {
        return res.status(403).json({ message: "Forbidden: Admin privileges have expired" });
      }
    }
    
    return next();
  }
  res.status(403).json({ message: "Forbidden: Settings access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Set up authentication routes
  setupAuth(app);
  
  // ลงทะเบียน admin data routes
  app.use(adminDataRoutes);
  
  // Store connected clients with their user IDs
  const clients = new Map<number, WebSocket>();
  
  // Helper function to broadcast to all connected clients or specific users
  const broadcastEvent = (eventType: string, data: any, userIds?: number[]) => {
    const message = JSON.stringify({
      type: eventType,
      data: data
    });
    
    if (userIds && userIds.length > 0) {
      // Send only to specified users
      userIds.forEach(userId => {
        const client = clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } else {
      // Broadcast to all clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  };
  
  // Helper function to send notification and websocket message
  const sendNotification = async (userId: number, title: string, content: string, type: string, relatedEntityId: number, broadcastType?: string) => {
    const notification = await storage.createNotification({
      userId,
      title,
      content,
      type,
      relatedEntityId,
      isRead: false
    });
    
    // Send real-time notification if user is connected
    const userWs = clients.get(userId);
    if (userWs && userWs.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
      
      // Also send the related entity update if a broadcast type is specified
      if (broadcastType) {
        userWs.send(JSON.stringify({
          type: broadcastType,
          data: { id: relatedEntityId }
        }));
      }
    }
    
    return notification;
  };
  
  wss.on('connection', (ws, req) => {
    log('WebSocket client connected', 'ws');
    
    // Handle received messages
    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        
        // Handle different message types
        switch (parsedMessage.type) {
          case 'auth':
            // Store client connection with user ID
            if (parsedMessage.userId) {
              clients.set(parsedMessage.userId, ws);
              log(`User ${parsedMessage.userId} authenticated on WebSocket`, 'ws');
              
              // Send initial online users list
              ws.send(JSON.stringify({
                type: 'online_users',
                users: Array.from(clients.keys())
              }));
              
              // Notify other clients of new online user
              broadcastEvent('user_online', { userId: parsedMessage.userId });
            }
            break;
            
          case 'chat':
            // Validate and store chat message
            try {
              const validMessage = insertMessageSchema.parse(parsedMessage.data);
              const savedMessage = await storage.createMessage(validMessage);
              
              // Send to recipient if online
              const recipientWs = clients.get(validMessage.receiverId);
              if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                recipientWs.send(JSON.stringify({
                  type: 'chat',
                  data: savedMessage
                }));
              }
              
              // Send the message back to sender with the saved data for real-time display
              ws.send(JSON.stringify({
                type: 'chat',
                data: savedMessage
              }));
              
              // Send confirmation back to sender
              ws.send(JSON.stringify({
                type: 'confirmation',
                messageId: savedMessage.id,
                status: 'delivered'
              }));
              
              // Create notification for recipient
              const sender = await storage.getUser(validMessage.senderId);
              if (sender) {
                await sendNotification(
                  validMessage.receiverId,
                  'New Message',
                  `You have a new message from ${sender.fullName}`,
                  'chat',
                  savedMessage.id
                );
              }
            } catch (error) {
              log(`Invalid message format: ${error}`, 'ws');
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
              }));
            }
            break;
          
          case 'ping':
            // Keep-alive ping
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
            
          default:
            log(`Unknown message type: ${parsedMessage.type}`, 'ws');
        }
      } catch (error) {
        log(`WebSocket message error: ${error}`, 'ws');
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      log('WebSocket client disconnected', 'ws');
      // Remove client from the clients map and notify others
      Array.from(clients.entries()).forEach(([userId, client]) => {
        if (client === ws) {
          clients.delete(userId);
          log(`User ${userId} disconnected from WebSocket`, 'ws');
          
          // Notify other clients of offline user
          broadcastEvent('user_offline', { userId: userId });
        }
      });
    });
  });
  
  // User API Routes
  
  // Get current user profile
  app.get('/api/profile', isAuthenticated, async (req, res) => {
    const user = { ...req.user };
    delete user.password;
    res.json(user);
  });
  
  // Update user profile
  app.patch('/api/profile', isAuthenticated, async (req, res) => {
    try {
      // Disallow changing username, email, or admin status through this endpoint
      const allowedUpdates = ['fullName', 'phone', 'birthDate', 'address', 'occupation', 'monthlyIncome', 'remainingIncome', 'idCardNumber', 'age', 'frontIdCardImage', 'backIdCardImage', 'selfieWithIdCardImage'];
      const updates: Partial<User> = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          (updates as any)[field] = req.body[field];
        }
      }
      
      const user = req.user as User;
      const updatedUser = await storage.updateUser(user.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const userResponse = { ...updatedUser } as any;
      if (userResponse.password) {
        delete userResponse.password;
      }
      
      res.json(userResponse);
    } catch (error) {
      log(`Profile update error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });
  
  // Loan API Routes
  
  // Get available loan info for current user
  app.get('/api/loans/available', isAuthenticated, async (req, res) => {
    try {
      // In a real application, this would query a credit scoring system
      // For now, we'll return a fixed amount based on user data
      const user = req.user;
      let availableAmount = 50000; // Default amount
      let interestRate = 85; // 0.85% per month (in basis points)
      
      // Adjust based on income if available
      if (user.monthlyIncome) {
        // Simple formula: 5x monthly income up to 100,000
        availableAmount = Math.min(user.monthlyIncome * 5, 100000);
      }
      
      res.json({
        availableAmount,
        interestRate,
        term: 12, // Default term in months
      });
    } catch (error) {
      log(`Available loan error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get available loan info' });
    }
  });
  
  // Get user's loans
  app.get('/api/loans', isAuthenticated, async (req, res) => {
    try {
      const loans = await storage.getLoansByUserId(req.user.id);
      res.json(loans);
    } catch (error) {
      log(`Get loans error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get loans' });
    }
  });
  
  // Create a new loan application
  app.post('/api/loans', isAuthenticated, async (req, res) => {
    try {
      const loanData = insertLoanSchema.parse(req.body);
      
      // Add the current user ID
      loanData.userId = req.user.id;
      
      const loan = await storage.createLoan(loanData);
      
      // Create notification for admin
      await sendNotification(
        1, // Admin ID (assuming admin ID is 1)
        'New Loan Application',
        `New loan application of ฿${loan.amount} from ${req.user.fullName}`,
        'loan',
        loan.id
      );
      
      // Broadcast new loan application to admin with specific type for real-time notifications
      broadcastEvent('loan_created', loan, [1]);
      
      res.status(201).json(loan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid loan data', errors: error.errors });
      }
      log(`Create loan error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to create loan' });
    }
  });
  
  // Get loan by ID (users can only view their own loans)
  app.get('/api/loans/:id', isAuthenticated, async (req, res) => {
    try {
      const loan = await storage.getLoan(parseInt(req.params.id));
      
      if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
      }
      
      // Check if the loan belongs to the requesting user or the user is an admin
      if (loan.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(loan);
    } catch (error) {
      log(`Get loan error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get loan' });
    }
  });
  
  // Chat API Routes
  
  // Get all messages for the current user
  app.get('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getUserMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      log(`Get all messages error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });
  
  // Get chat history between current user and another user
  app.get('/api/messages/:userId', isAuthenticated, async (req, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      const messages = await storage.getMessagesBetweenUsers(req.user.id, otherUserId);
      
      // Mark messages as read
      for (const message of messages) {
        if (message.receiverId === req.user.id && !message.isRead) {
          await storage.markMessageAsRead(message.id);
        }
      }
      
      res.json(messages);
    } catch (error) {
      log(`Get messages error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });
  
  // Get all chat users for the current user (who they've chatted with)
  app.get('/api/chat-users', isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getUserMessages(req.user.id);
      
      // Get unique user IDs
      const userIds = new Set<number>();
      messages.forEach(msg => {
        if (msg.senderId !== req.user.id) userIds.add(msg.senderId);
        if (msg.receiverId !== req.user.id) userIds.add(msg.receiverId);
      });
      
      // Get user info for each ID
      const chatUsers = [];
      const userPromises = Array.from(userIds).map(async (userId) => {
        const user = await storage.getUser(userId);
        if (user) {
          // Don't send password
          const { password, ...safeUser } = user;
          chatUsers.push(safeUser);
        }
      });
      
      // Wait for all user info to be fetched
      await Promise.all(userPromises);
      
      // If user has no chats, include admin for first-time chat
      if (chatUsers.length === 0 && !req.user.isAdmin) {
        const admin = await storage.getUser(1); // Admin user
        if (admin) {
          const { password, ...safeAdmin } = admin;
          chatUsers.push(safeAdmin);
        }
      }
      
      res.json(chatUsers);
    } catch (error) {
      log(`Get chat users error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get chat users' });
    }
  });
  
  // Notification API Routes
  
  // Get notifications for the current user
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      log(`Get notifications error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get notifications' });
    }
  });
  
  // Mark notification as read
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.getNotification(parseInt(req.params.id));
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Check if the notification belongs to the requesting user
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notification.id);
      res.json(updatedNotification);
    } catch (error) {
      log(`Mark notification error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });
  
  // Admin API Routes
  
  // Admin Management API (super admin only)
  app.get('/api/admin/roles', isSuperAdmin, async (req, res) => {
    try {
      const admins = await storage.getAdmins();
      
      // Remove passwords from response
      const safeAdmins = admins.map(admin => {
        const { password, ...safeAdmin } = admin;
        return safeAdmin;
      });
      
      res.json(safeAdmins);
    } catch (error) {
      log(`Get admins error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get admins list' });
    }
  });
  
  app.post('/api/admin/roles', isSuperAdmin, async (req, res) => {
    try {
      const { userId, adminRole, durationValue, durationUnit, canAccessSettings } = req.body;
      
      if (!userId || !adminRole || !durationValue || !durationUnit) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // คำนวณวันที่สิ้นสุดจากจำนวนและหน่วยเวลา
      const now = new Date();
      const expiresAt = new Date(now);
      
      switch (durationUnit) {
        case 'minutes':
          expiresAt.setMinutes(now.getMinutes() + durationValue);
          break;
        case 'hours':
          expiresAt.setHours(now.getHours() + durationValue);
          break;
        case 'days':
          expiresAt.setDate(now.getDate() + durationValue);
          break;
        case 'months':
          expiresAt.setMonth(now.getMonth() + durationValue);
          break;
        case 'years':
          expiresAt.setFullYear(now.getFullYear() + durationValue);
          break;
        default:
          return res.status(400).json({ message: 'Invalid duration unit' });
      }
      
      // แต่งตั้งแอดมิน
      const assigningAdminId = req.user.id;
      // กำหนด canAccessSettings เป็น boolean (true/false)
      const hasSettingsAccess = Boolean(canAccessSettings);
      const admin = await storage.assignAdmin(userId, adminRole, expiresAt, assigningAdminId, hasSettingsAccess);
      
      if (!admin) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // สร้างการแจ้งเตือนให้ผู้ใช้ที่ถูกแต่งตั้ง
      await sendNotification(
        userId,
        'การแต่งตั้งแอดมิน',
        `คุณได้รับการแต่งตั้งเป็นแอดมินโดย ${req.user.fullName} สิทธิ์จะหมดอายุในวันที่ ${expiresAt.toLocaleDateString('th-TH')}`,
        'system',
        0
      );
      
      // ลบรหัสผ่านก่อนตอบกลับ
      const { password, ...safeAdmin } = admin;
      
      res.json(safeAdmin);
    } catch (error) {
      log(`Assign admin error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to assign admin role', error: error.message });
    }
  });
  
  app.delete('/api/admin/roles/:userId', isSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // ถอดถอนแอดมิน
      const user = await storage.revokeAdmin(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      
      // สร้างการแจ้งเตือนให้ผู้ใช้ที่ถูกถอดถอน
      await sendNotification(
        userId,
        'การถอดถอนแอดมิน',
        `สิทธิ์แอดมินของคุณถูกถอดถอนโดย ${req.user.fullName}`,
        'system',
        0
      );
      
      // ลบรหัสผ่านก่อนตอบกลับ
      const { password, ...safeUser } = user;
      
      res.json(safeUser);
    } catch (error) {
      log(`Revoke admin error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to revoke admin role', error: error.message });
    }
  });
  
  // Get all users (admin only)
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      log(`Admin get users error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get users' });
    }
  });
  
  // Create new user (admin only)
  app.post('/api/admin/users', isAdmin, async (req, res) => {
    try {
      // Validate required fields
      const { username, password, fullName, email } = req.body;
      
      if (!username || !password || !fullName || !email) {
        return res.status(400).json({ 
          message: 'Required fields missing. Username, password, fullName and email are required.' 
        });
      }
      
      // Create user
      const newUser = await storage.createUser({
        username,
        password,
        fullName,
        email,
        phone: req.body.phone || "",
        address: req.body.address || null,
        occupation: req.body.occupation || null,
        monthlyIncome: req.body.monthlyIncome || null,
        idCardNumber: req.body.idCardNumber || null,
        withdrawalCode: req.body.withdrawalCode || null,
        isActive: req.body.status !== "blocked_login",
        status: req.body.status === "blocked_login" ? "active" : req.body.status || "active",
        isAdmin: false,
        authProvider: "local",
      });
      
      // Create account for the new user
      await storage.createAccount({
        userId: newUser.id,
        balance: 0,
        bankName: null,
        accountNumber: null,
        accountName: null,
      });
      
      // Remove password from response
      const { password: _, ...safeUser } = newUser;
      
      res.status(201).json(safeUser);
    } catch (error) {
      log(`Admin create user error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to create user' });
    }
  });
  
  // Update user (admin only)
  app.patch('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Admin can update any field except password
      const { password, ...updates } = req.body;
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password: _, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      log(`Admin update user error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to update user' });
    }
  });
  
  // Get all loans (admin only)
  app.get('/api/admin/loans', isAdmin, async (req, res) => {
    try {
      const loans = await storage.getAllLoans();
      res.json(loans);
    } catch (error) {
      log(`Admin get loans error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get loans' });
    }
  });
  
  // Update loan status (admin only)
  app.patch('/api/admin/loans/:id', isAdmin, async (req, res) => {
    try {
      const loanId = parseInt(req.params.id);
      const loan = await storage.getLoan(loanId);
      
      if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
      }
      
      // Validate status
      const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
      if (req.body.status && !validStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      // Update loan with admin ID
      const updates = {
        ...req.body,
        adminId: req.user.id
      };
      
      const updatedLoan = await storage.updateLoan(loanId, updates);
      if (!updatedLoan) {
        return res.status(404).json({ message: 'Loan not found' });
      }
      
      // If loan is approved, add amount to user account
      if (req.body.status === 'approved' && loan.status !== 'approved') {
        const account = await storage.updateAccountBalance(loan.userId, loan.amount);
        
        // Create notification for the balance update
        await sendNotification(
          loan.userId,
          'เงินเข้าบัญชี',
          `เงินกู้จำนวน ฿${loan.amount} ได้รับการอนุมัติและเข้าบัญชีของคุณแล้ว`,
          'account',
          loan.id,
          'account_update'
        );
        
        // Broadcast account update to the user
        broadcastEvent('account_updated', account, [loan.userId]);
      }
      
      // Create notification for the loan status update with real-time update
      if (req.body.status) {
        const thaiStatusText = req.body.status === 'approved' ? 'อนุมัติ' : 
                              req.body.status === 'rejected' ? 'ปฏิเสธ' : 
                              req.body.status === 'completed' ? 'เสร็จสิ้น' : 'รออนุมัติ';
        
        await sendNotification(
          loan.userId,
          `สถานะเงินกู้: ${thaiStatusText}`,
          `คำขอสินเชื่อจำนวน ฿${loan.amount.toLocaleString()} ของคุณได้รับการ${thaiStatusText}`,
          'loan',
          loan.id,
          'loan_update'
        );
        
        // Broadcast loan update to the user
        broadcastEvent('loan_updated', updatedLoan, [loan.userId]);
      }
      
      res.json(updatedLoan);
    } catch (error) {
      log(`Admin update loan error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to update loan' });
    }
  });
  
  // Account API Routes
  
  // Get user account balance
  app.get('/api/account', isAuthenticated, async (req, res) => {
    try {
      let account = await storage.getAccount(req.user.id);
      
      // If no account exists, create one
      if (!account) {
        account = await storage.createAccount({
          userId: req.user.id,
          balance: 0
        });
      }
      
      res.json(account);
    } catch (error) {
      log(`Get account error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get account information' });
    }
  });
  
  // Update bank account details
  app.patch('/api/account/bank', isAuthenticated, async (req, res) => {
    try {
      const { bankName, accountNumber, accountName } = req.body;
      
      // Validate bank account data
      if (!bankName || !accountNumber || !accountName) {
        return res.status(400).json({ message: 'ข้อมูลบัญชีธนาคารไม่ครบถ้วน' });
      }
      
      // Get current account
      let account = await storage.getAccount(req.user.id);
      
      if (!account) {
        // Create account if not exists
        account = await storage.createAccount({
          userId: req.user.id,
          balance: 0,
          bankName,
          accountNumber,
          accountName
        });
      } else {
        // Update existing account
        account = await storage.updateAccount(req.user.id, {
          bankName,
          accountNumber,
          accountName,
          updatedAt: new Date()
        });
      }
      
      if (!account) {
        return res.status(500).json({ message: 'ไม่สามารถอัพเดทข้อมูลบัญชีได้' });
      }
      
      res.json(account);
    } catch (error) {
      log(`Update bank account error: ${error}`, 'api');
      res.status(500).json({ message: 'ไม่สามารถอัพเดทข้อมูลบัญชีได้' });
    }
  });
  
  // File Upload API Route
  
  // Upload file for chat
  app.post('/api/messages/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const receiverId = parseInt(req.body.receiverId || '0');
      if (!receiverId) {
        return res.status(400).json({ message: 'Receiver ID is required' });
      }

      // Create virtual URL path to the file
      const fileUrl = `/uploads/${req.file.filename}`;
      const messageType = req.body.messageType || 'file';

      // Create message with file attachment
      const message = await storage.createMessage({
        senderId: req.user.id,
        receiverId,
        content: '',
        messageType,
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileMimeType: req.file.mimetype,
        isRead: false,
      });

      // Send through WebSocket if available
      const recipientWs = clients.get(receiverId);
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        recipientWs.send(JSON.stringify({
          type: 'chat',
          data: message
        }));
      }
      
      // Also send back to sender for real-time updates
      const senderWs = clients.get(req.user.id);
      if (senderWs && senderWs.readyState === WebSocket.OPEN) {
        senderWs.send(JSON.stringify({
          type: 'chat',
          data: message
        }));
      }

      res.json({ success: true, message });
    } catch (error) {
      log(`File upload error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // อัพโหลดรูปภาพเพื่อยืนยันตัวตนสำหรับการขอสินเชื่อ
  app.post('/api/loans/upload-images', isAuthenticated, upload.fields([
    { name: 'frontIdCardImage', maxCount: 1 },
    { name: 'backIdCardImage', maxCount: 1 },
    { name: 'selfieWithIdCardImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      if (!req.files) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const uploadedFiles: { [key: string]: string } = {};
      
      // สร้าง URL สำหรับแต่ละไฟล์ที่อัพโหลด
      if (files.frontIdCardImage && files.frontIdCardImage.length > 0) {
        uploadedFiles.frontIdCardImage = `/uploads/${files.frontIdCardImage[0].filename}`;
      }
      
      if (files.backIdCardImage && files.backIdCardImage.length > 0) {
        uploadedFiles.backIdCardImage = `/uploads/${files.backIdCardImage[0].filename}`;
      }
      
      if (files.selfieWithIdCardImage && files.selfieWithIdCardImage.length > 0) {
        uploadedFiles.selfieWithIdCardImage = `/uploads/${files.selfieWithIdCardImage[0].filename}`;
      }
      
      log(`Loan images uploaded successfully for user ID: ${req.user.id}`, 'api');
      res.json({ success: true, files: uploadedFiles });
      
    } catch (error) {
      log(`Loan images upload error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to upload loan verification images' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Withdrawal API Routes
  
  // Get user withdrawals
  app.get('/api/withdrawals', isAuthenticated, async (req, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.user.id);
      res.json(withdrawals);
    } catch (error) {
      log(`Get withdrawals error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get withdrawals' });
    }
  });
  
  // Create a new withdrawal request
  // Payment endpoint to add money to user's account
  app.post('/api/payments', isAuthenticated, async (req, res) => {
    try {
      // Validate incoming data 
      const { amount } = req.body;
      const userId = req.user?.id;
      
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid payment data" });
      }
      
      // Get the user's account
      let account = await storage.getAccount(userId);
      
      if (!account) {
        // Create account if not exists
        account = await storage.createAccount({ userId, balance: 0 });
      }
      
      // Add the amount to account balance
      const updatedAccount = await storage.updateAccountBalance(userId, amount);
      
      if (!updatedAccount) {
        return res.status(500).json({ error: "Failed to update account balance" });
      }
      
      // Create notification
      await sendNotification(
        userId,
        "ชำระเงินสำเร็จ",
        `ยอดเงินในบัญชีของคุณถูกเพิ่มขึ้น ฿${amount.toLocaleString()}`,
        'payment',
        userId,
        'account_update'
      );
      
      // Broadcast account update to the user
      broadcastEvent('account_updated', updatedAccount, [userId]);
      
      return res.status(200).json({ success: true, account: updatedAccount });
    } catch (error) {
      console.error("Payment error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/withdrawals', isAuthenticated, async (req, res) => {
    try {
      const withdrawalData = insertWithdrawalSchema.parse(req.body);
      
      // Add the current user ID
      withdrawalData.userId = req.user.id;
      
      // Check if user has enough balance
      const account = await storage.getAccount(req.user.id);
      if (!account || account.balance < withdrawalData.amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      const withdrawal = await storage.createWithdrawal(withdrawalData);
      
      // Create notification for admin
      await sendNotification(
        1, // Admin ID (assuming admin ID is 1)
        'New Withdrawal Request',
        `New withdrawal request of ฿${withdrawal.amount} from ${req.user.fullName}`,
        'withdrawal',
        withdrawal.id
      );
      
      // Broadcast new withdrawal to admin with specific type for real-time notifications
      broadcastEvent('withdrawal_created', withdrawal, [1]);
      
      res.status(201).json(withdrawal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid withdrawal data', errors: error.errors });
      }
      log(`Create withdrawal error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to create withdrawal request' });
    }
  });
  
  // Admin get all withdrawals
  app.get('/api/admin/withdrawals', isAdmin, async (req, res) => {
    try {
      const withdrawals = await storage.getAllWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      log(`Admin get withdrawals error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get withdrawals' });
    }
  });
  
  // Update withdrawal status (admin only)
  app.patch('/api/admin/withdrawals/:id', isAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const withdrawal = await storage.getWithdrawal(withdrawalId);
      
      if (!withdrawal) {
        return res.status(404).json({ message: 'Withdrawal not found' });
      }
      
      // Validate status
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (req.body.status && !validStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      // Update withdrawal with admin ID
      const updates = {
        ...req.body,
        adminId: req.user.id
      };
      
      const updatedWithdrawal = await storage.updateWithdrawal(withdrawalId, updates);
      if (!updatedWithdrawal) {
        return res.status(404).json({ message: 'Withdrawal not found' });
      }
      
      // Create notification for the withdrawal owner with real-time update
      if (req.body.status) {
        const statusText = req.body.status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
        
        await sendNotification(
          withdrawal.userId,
          `คำขอถอนเงิน${statusText}แล้ว`,
          `คำขอถอนเงินจำนวน ฿${withdrawal.amount.toLocaleString()} ของคุณได้รับการ${statusText}`,
          'withdrawal',
          withdrawal.id,
          'withdrawal_update'
        );
        
        // เมื่ออนุมัติการถอนเงิน ไม่ต้องหักเงินจากบัญชีอีก เพราะได้หักไปแล้วตอนสร้างคำขอถอน
        if (req.body.status === 'approved') {
          // ดึงข้อมูลบัญชีปัจจุบันเพื่อส่งข้อมูลอัพเดตผ่าน WebSocket
          const account = await storage.getAccount(withdrawal.userId);
          
          // ส่งข้อมูลบัญชีเพื่ออัพเดตแสดงผลหน้าเว็บ
          if (account) {
            broadcastEvent('account_updated', account, [withdrawal.userId]);
          }
        }
        
        // Broadcast withdrawal update to user
        broadcastEvent('withdrawal_updated', updatedWithdrawal, [withdrawal.userId]);
      }
      
      res.json(updatedWithdrawal);
    } catch (error) {
      log(`Admin update withdrawal error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to update withdrawal' });
    }
  });

  // Admin get all accounts
  app.get('/api/admin/accounts', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const accountPromises = users.map(user => storage.getAccount(user.id));
      const accounts = await Promise.all(accountPromises);
      
      // Filter out undefined accounts (users who don't have an account yet)
      const validAccounts = accounts.filter(account => account !== undefined) as Account[];
      
      res.json(validAccounts);
    } catch (error) {
      log(`Admin get accounts error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get accounts' });
    }
  });
  
  // Update account information (admin only)
  app.patch('/api/admin/accounts/:userId', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get existing account
      let account = await storage.getAccount(userId);
      
      if (!account) {
        // Create account if not exists
        account = await storage.createAccount({
          userId,
          balance: 0
        });
      }
      
      const { withdrawalCode, ...updates } = req.body;
      
      // Update account
      const updatedAccount = await storage.updateAccount(userId, {
        ...updates,
        ...(withdrawalCode ? { withdrawalCode } : {})
      });
      
      if (!updatedAccount) {
        return res.status(404).json({ message: 'Account not found' });
      }
      
      res.json(updatedAccount);
    } catch (error) {
      log(`Admin update account error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to update account' });
    }
  });

  // Adjust account balance (admin only)
  app.post('/api/admin/accounts/:userId/adjust-balance', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { amount, note } = req.body;
      
      if (typeof amount !== 'number') {
        return res.status(400).json({ message: 'Amount must be a number' });
      }
      
      // Get existing account
      let account = await storage.getAccount(userId);
      
      if (!account) {
        // Create account if not exists
        account = await storage.createAccount({
          userId,
          balance: 0
        });
      }
      
      // Update account balance
      const updatedAccount = await storage.updateAccountBalance(userId, amount);
      
      if (!updatedAccount) {
        return res.status(500).json({ message: 'Failed to update account balance' });
      }
      
      // Get user info for notification
      const user = await storage.getUser(userId);
      
      if (user) {
        // Create notification for the user
        await sendNotification(
          userId,
          amount > 0 ? 'เงินเข้าบัญชี' : 'เงินออกจากบัญชี',
          amount > 0 
            ? `เพิ่มเงินเข้าบัญชีของคุณ ${amount.toLocaleString('th-TH')} บาท${note ? ` - ${note}` : ''}`
            : `หักเงินออกจากบัญชีของคุณ ${Math.abs(amount).toLocaleString('th-TH')} บาท${note ? ` - ${note}` : ''}`,
          'system',
          0
        );
        
        // Broadcast the account update to the user
        broadcastEvent('account_updated', updatedAccount, [userId]);
      }
      
      res.json(updatedAccount);
    } catch (error) {
      log(`Error adjusting account balance: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to adjust account balance' });
    }
  });
  
  // Settings API routes (Admin only)
  
  // Get theme settings
  app.get('/api/admin/settings/theme', hasSettingsAccess, (req, res) => {
    try {
      import('fs').then(fs => {
        import('path').then(path => {
          const themeFilePath = path.join(process.cwd(), 'theme.json');
          
          if (fs.existsSync(themeFilePath)) {
            const themeData = fs.readFileSync(themeFilePath, 'utf8');
            const theme = JSON.parse(themeData);
            res.json(theme);
          } else {
            // If theme.json doesn't exist, return default theme
            const defaultTheme = {
              primary: "hsl(179, 75%, 37%)",
              variant: "professional",
              appearance: "light",
              radius: 0.5
            };
            res.json(defaultTheme);
          }
        }).catch(error => {
          throw error;
        });
      }).catch(error => {
        throw error;
      });
    } catch (error) {
      log(`Get theme settings error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get theme settings' });
    }
  });
  
  // Save theme settings
  app.post('/api/admin/settings/theme', hasSettingsAccess, (req, res) => {
    try {
      import('fs').then(fs => {
        import('path').then(path => {
          const themeData = JSON.stringify(req.body, null, 2);
          const themeFilePath = path.join(process.cwd(), 'theme.json');
          
          fs.writeFileSync(themeFilePath, themeData);
          
          res.json({ success: true, message: 'Theme settings saved successfully' });
        }).catch(error => {
          throw error;
        });
      }).catch(error => {
        throw error;
      });
    } catch (error) {
      log(`Save theme settings error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to save theme settings' });
    }
  });
  
  // Get brand settings (admin only)
  app.get('/api/admin/settings/brand', hasSettingsAccess, (req, res) => {
    try {
      import('fs').then(fs => {
        import('path').then(path => {
          const brandFilePath = path.join(process.cwd(), 'brand.json');
          
          if (fs.existsSync(brandFilePath)) {
            const brandData = fs.readFileSync(brandFilePath, 'utf8');
            const brand = JSON.parse(brandData);
            res.json(brand);
          } else {
            // If brand.json doesn't exist, return default brand settings
            const defaultBrand = {
              siteName: "CashLuxe",
              logoUrl: "",
              siteDescription: "บริการเงินกู้ออนไลน์ รวดเร็ว ปลอดภัย น่าเชื่อถือ",
              footerText: "© 2025 CashLuxe - บริการเงินกู้ออนไลน์",
              login: {
                logoIcon: "",
                mainTitle: "CashLuxe",
                subTitle: "สินเชื่อส่วนบุคคล ทางเลือกทางการเงินที่เชื่อถือได้",
                backgroundColor: "hsl(179, 75%, 37%)"
              }
            };
            res.json(defaultBrand);
          }
        }).catch(error => {
          throw error;
        });
      }).catch(error => {
        throw error;
      });
    } catch (error) {
      log(`Get brand settings error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get brand settings' });
    }
  });
  
  // Get brand settings (public - for auth page and public pages)
  app.get('/api/settings/brand', (req, res) => {
    try {
      import('fs').then(fs => {
        import('path').then(path => {
          const brandFilePath = path.join(process.cwd(), 'brand.json');
          
          if (fs.existsSync(brandFilePath)) {
            const brandData = fs.readFileSync(brandFilePath, 'utf8');
            const brand = JSON.parse(brandData);
            res.json(brand);
          } else {
            // If brand.json doesn't exist, return default brand settings
            const defaultBrand = {
              siteName: "CashLuxe",
              logoUrl: "",
              siteDescription: "บริการเงินกู้ออนไลน์ รวดเร็ว ปลอดภัย น่าเชื่อถือ",
              footerText: "© 2025 CashLuxe - บริการเงินกู้ออนไลน์",
              login: {
                logoIcon: "",
                mainTitle: "CashLuxe",
                subTitle: "สินเชื่อส่วนบุคคล ทางเลือกทางการเงินที่เชื่อถือได้",
                backgroundColor: "hsl(179, 75%, 37%)"
              }
            };
            res.json(defaultBrand);
          }
        }).catch(error => {
          throw error;
        });
      }).catch(error => {
        throw error;
      });
    } catch (error) {
      log(`Get public brand settings error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to get brand settings' });
    }
  });
  
  // Save brand settings
  app.post('/api/admin/settings/brand', hasSettingsAccess, (req, res) => {
    try {
      import('fs').then(fs => {
        import('path').then(path => {
          const brandData = JSON.stringify(req.body, null, 2);
          const brandFilePath = path.join(process.cwd(), 'brand.json');
          
          fs.writeFileSync(brandFilePath, brandData);
          
          res.json({ success: true, message: 'Brand settings saved successfully' });
        }).catch(error => {
          throw error;
        });
      }).catch(error => {
        throw error;
      });
    } catch (error) {
      log(`Save brand settings error: ${error}`, 'api');
      res.status(500).json({ message: 'Failed to save brand settings' });
    }
  });
  
  return httpServer;
}
