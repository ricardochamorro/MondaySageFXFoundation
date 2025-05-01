import 'express-session';
import { User, MondayAccount } from '@prisma/client';

interface UserWithMondayAccount extends User {
  mondayAccount?: MondayAccount;
}

declare module 'express-session' {
  interface SessionData {
    jwtToken?: string;
    passport?: {
      user?: UserWithMondayAccount;
    };
  }
}
