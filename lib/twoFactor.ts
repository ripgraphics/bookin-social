import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'your-32-character-encryption-key';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate 2FA secret and QR code
 */
export async function generate2FASecret(userEmail: string): Promise<{
  secret: string;
  encryptedSecret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  encryptedBackupCodes: string[];
}> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Bookin (${userEmail})`,
    issuer: 'Bookin',
    length: 32,
  });

  // Encrypt secret
  const encryptedSecret = encrypt(secret.base32);

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    backupCodes.push(code);
  }

  // Encrypt backup codes
  const encryptedBackupCodes = backupCodes.map(code => encrypt(code));

  return {
    secret: secret.base32,
    encryptedSecret,
    qrCodeUrl,
    backupCodes,
    encryptedBackupCodes,
  };
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(encryptedSecret: string, token: string): boolean {
  try {
    const secret = decrypt(encryptedSecret);
    
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after for clock drift
    });
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    return false;
  }
}

/**
 * Verify backup code
 */
export function verifyBackupCode(
  encryptedBackupCodes: string[],
  code: string
): { valid: boolean; remainingCodes?: string[] } {
  try {
    const decryptedCodes = encryptedBackupCodes.map(encrypted => decrypt(encrypted));
    const codeIndex = decryptedCodes.findIndex(c => c === code.toUpperCase());
    
    if (codeIndex === -1) {
      return { valid: false };
    }

    // Remove used code
    const remainingEncryptedCodes = encryptedBackupCodes.filter((_, index) => index !== codeIndex);
    
    return {
      valid: true,
      remainingCodes: remainingEncryptedCodes,
    };
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return { valid: false };
  }
}

/**
 * Generate new backup codes
 */
export function generateBackupCodes(): {
  backupCodes: string[];
  encryptedBackupCodes: string[];
} {
  const backupCodes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    backupCodes.push(code);
  }

  const encryptedBackupCodes = backupCodes.map(code => encrypt(code));

  return {
    backupCodes,
    encryptedBackupCodes,
  };
}

/**
 * Decrypt backup codes for display
 */
export function decryptBackupCodes(encryptedBackupCodes: string[]): string[] {
  return encryptedBackupCodes.map(encrypted => decrypt(encrypted));
}

