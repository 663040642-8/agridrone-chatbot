const fs = require('fs');
const targetPath = './src/environments/environment.ts';

// ใช้องค์ประกอบจาก environment.ts เดิมของคุณเป็นแม่แบบ
const envConfigFile = `
export const environment = {
  production: true,
  // ใช้ค่าจาก Environment Variables ของ Railway/Vercel โดยตรง
  apiUrl: '${process.env.API_URL || 'https://agridrone-chatbot.onrender.com'}',
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_ANON_KEY}',
};
`;

// เขียนไฟล์ environment.ts ทับด้วยค่าจริง
fs.writeFileSync(targetPath, envConfigFile, { encoding: 'utf8' });
console.log(`✅ Environment file written to ${targetPath}`);