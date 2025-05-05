import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // รัน migrations สำหรับฐานข้อมูล
  try {
    await runMigrations();
  } catch (error) {
    console.error("Migration failed but continuing startup:", error);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ใช้พอร์ตจากตัวแปรสภาพแวดล้อม หรือใช้พอร์ตสำรองที่ 3001 ถ้าพอร์ต 5000 ไม่ว่าง
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  
  // ฟังก์ชันสำหรับเริ่มเซิร์ฟเวอร์ด้วยพอร์ตที่กำหนด
  const tryPort = (ports: number[], index = 0) => {
    if (index >= ports.length) {
      log(`Failed to start server: All ports are in use`);
      return;
    }
    
    const currentPort = ports[index];
    log(`Attempting to start server on port ${currentPort}`);
    
    server.listen({
      port: currentPort,
      host: "0.0.0.0",
    }, () => {
      log(`Server is running on port ${currentPort}`);
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${currentPort} is in use, trying next port`);
        // ลองพอร์ตถัดไป
        tryPort(ports, index + 1);
      } else {
        log(`Failed to start server: ${err.message}`);
        throw err;
      }
    });
  };
  
  // ใช้พอร์ตหลายพอร์ตตามลำดับความสำคัญ
  tryPort([5000, 3001, 3000, 8000, 8080]);
})();
