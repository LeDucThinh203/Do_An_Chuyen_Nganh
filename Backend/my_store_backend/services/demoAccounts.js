import bcrypt from 'bcryptjs';
import * as accountRepo from '../repositories/accountRepository.js';

const getDemoAccounts = () => [
  {
    email: process.env.DEMO_ADMIN_EMAIL || 'admin@admin.com',
    username: 'Demo Admin',
    password: process.env.DEMO_ADMIN_PASSWORD || '123456',
    role: 'admin',
  },
  {
    email: process.env.DEMO_USER_EMAIL || 'user@user.com',
    username: 'Demo User',
    password: process.env.DEMO_USER_PASSWORD || '123456',
    role: 'user',
  },
];

export const ensureDemoAccounts = async () => {
  const explicitlyDisabled = process.env.ENABLE_DEMO_ACCOUNTS === 'false';
  const enabled = process.env.ENABLE_DEMO_ACCOUNTS === 'true'
    || (process.env.NODE_ENV === 'production' && !explicitlyDisabled);
  if (!enabled) return;

  for (const demoAccount of getDemoAccounts()) {
    if (await accountRepo.getAccountByEmail(demoAccount.email)) continue;

    try {
      const hashedPassword = await bcrypt.hash(demoAccount.password, 10);
      await accountRepo.createAccount({ ...demoAccount, password: hashedPassword });
      console.log(`[demo] Created ${demoAccount.role} account ${demoAccount.email}`);
    } catch (error) {
      // Another backend instance may create the same account at the same time.
      if (error.code !== '23505') throw error;
    }
  }
};
