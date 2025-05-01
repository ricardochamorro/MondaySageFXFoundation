import 'express-session';
import { Request } from 'express';
import { Session } from 'express-session';
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

interface PassportSession {
  session?: {
    id: string;
    cookie: {
      originalMaxAge: number;
      expires: Date;
      secure: boolean;
      httpOnly: boolean;
      path: string;
      sameSite: boolean | 'lax' | 'strict' | 'none';
    };
  };
}

export interface AuthenticatedRequest extends Request {
  user: User & {
    mondayAccount: MondayAccount | null;
  };
  _passport?: PassportSession;
  rawBody?: Buffer;
  session: Session & {
    jwtToken?: string;
  };
}
