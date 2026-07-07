import { z } from 'zod';

export const SUPER_ADMIN_USERNAME = 'super_admin' as const;

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'Username can only contain letters, numbers, dots, underscores, and hyphens',
  );
