import { Request } from 'express';
import { User, MondayAccount } from '@prisma/client';
import { Session } from 'express-session';

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

interface UserWithMondayAccount extends User {
  mondayAccount?: MondayAccount;
}

export interface AuthenticatedRequest extends Request {
  user?: UserWithMondayAccount;
  session: Session & {
    jwtToken?: string;
    returnUrl?: string;
  };
  rawBody?: Buffer;
  _passport?: PassportSession;
}
