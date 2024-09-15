// custom.d.ts
import { UserPayload } from 'src/auth/jwt.strategy';

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }
}
