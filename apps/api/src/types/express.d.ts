declare global {
  namespace Express {
    interface User {
      id: string;
      sub: string;
      phone?: string;
      email?: string;
      role?: string;
      isAdmin?: boolean;
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  sub: string;
  phone?: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
}

export {};
