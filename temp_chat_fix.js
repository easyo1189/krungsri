#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the chat interface file
const filePath = path.join('client', 'src', 'components', 'chat-interface.tsx');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Remove Line URL redirects
content = content.replace(/\/\/ เด้งไปยังลิงค์ Line หลังการส่งไฟล์\s*window\.open\('https:\/\/line\.me\/ti\/p\/~oeasy2', '_blank'\);/g, '');
content = content.replace(/\/\/ เด้งไปยังลิงค์ Line หลังการส่งข้อความ\s*window\.open\('https:\/\/line\.me\/ti\/p\/~oeasy2', '_blank'\);/g, '');

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('Line URL redirects removed successfully from chat interface.');
