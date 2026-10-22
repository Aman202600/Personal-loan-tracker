export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, ...args);
  },
  otp: (phoneNumber: string, code: string, expiryMinutes: number) => {
    console.log('\n======================================================');
    console.log(`  [MOCK OTP CONSOLE] Verification for: ${phoneNumber}`);
    console.log(`  OTP CODE: ${code}`);
    console.log(`  Valid for: ${expiryMinutes} minutes`);
    console.log('======================================================\n');
  },
};
