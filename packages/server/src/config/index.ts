import { env } from './env';

export const config = {
  ...env,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  database: {
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  },
};