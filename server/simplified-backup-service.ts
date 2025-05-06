import fs from 'fs';
import path from 'path';
import { log } from './vite';
import { db } from './db';
import * as schema from '../shared/schema';

// Create backup directory
const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  log(`Created backup directory at ${backupDir}`, 'backup');
}

// Backup all data
export async function backupAllData(): Promise<void> {
  try {
    log('Starting full database backup', 'backup');
    const tables = Object.keys(schema)
      .filter(key => typeof (schema as any)[key] === 'object' && (schema as any)[key].name);
    
    const backupData: Record<string, any[]> = {};
    
    // Basic query for each table
    for (const tableName of tables) {
      try {
        // Simple approach - standard SQL query
        const data = await db.execute(`SELECT * FROM ${(schema as any)[tableName].name}`);
        backupData[tableName] = data;
      } catch (error) {
        log(`Error backing up table ${tableName}: ${error}`, 'backup');
        // Continue with other tables
      }
    }
    
    // Write backup file
    const backupPath = path.join(backupDir, 'database_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      tables: tables,
      data: backupData
    }, null, 2));
    
    log('Backup completed successfully', 'backup');
  } catch (error) {
    log(`Backup failed: ${error}`, 'backup');
  }
}

// Restore all data
export async function restoreAllData(): Promise<void> {
  try {
    const backupPath = path.join(backupDir, 'database_backup.json');
    
    if (!fs.existsSync(backupPath)) {
      log('No backup file found', 'backup');
      return;
    }
    
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    log(`Restoring backup from ${backup.timestamp}`, 'backup');
    
    // Restore each table
    for (const tableName of backup.tables) {
      try {
        const tableData = backup.data[tableName];
        if (!tableData || !tableData.length) continue;
        
        log(`Restoring ${tableData.length} records to ${tableName}`, 'backup');
        
        // Insert each record
        for (const record of tableData) {
          // Convert date strings to Date objects
          const cleanedRecord: any = {};
          for (const [key, value] of Object.entries(record)) {
            if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
              cleanedRecord[key] = new Date(value);
            } else {
              cleanedRecord[key] = value;
            }
          }
          
          // Skip the record if it already exists
          try {
            await db.insert((schema as any)[tableName]).values(cleanedRecord);
          } catch (insertError) {
            // Might be a duplicate entry, continue with next record
            log(`Could not insert record in ${tableName}: ${insertError}`, 'backup');
          }
        }
      } catch (tableError) {
        log(`Error restoring table ${tableName}: ${tableError}`, 'backup');
        // Continue with other tables
      }
    }
    
    log('Restore completed successfully', 'backup');
  } catch (error) {
    log(`Restore failed: ${error}`, 'backup');
  }
}

// Initialize backup system (simplified version)
export function startAutomaticBackup(): void {
  try {
    // Initial backup
    setTimeout(() => {
      backupAllData().catch(err => {
        log(`Initial backup failed: ${err}`, 'backup');
      });
    }, 5000); // Wait 5 seconds after startup
    
    // Check for backup file and restore if needed
    const backupPath = path.join(backupDir, 'database_backup.json');
    if (fs.existsSync(backupPath)) {
      log('Backup file found, attempting to restore', 'backup');
      setTimeout(() => {
        restoreAllData().catch(err => {
          log(`Restore failed: ${err}`, 'backup');
        });
      }, 2000); // Wait 2 seconds to let the database initialize
    }
    
    // Hourly backup
    setInterval(() => {
      backupAllData().catch(err => {
        log(`Scheduled backup failed: ${err}`, 'backup');
      });
    }, 3600000); // Every hour
    
    log('Automatic backup system initialized', 'backup');
  } catch (error) {
    log(`Failed to initialize backup system: ${error}`, 'backup');
  }
}
