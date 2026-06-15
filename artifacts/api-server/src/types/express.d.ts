declare namespace Express {
  interface Request {
    role?: string;
    userId?: string;
    userName?: string;
    userNationalId?: string;
  }
}
