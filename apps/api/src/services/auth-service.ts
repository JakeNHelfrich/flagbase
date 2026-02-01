import type { UserRepository } from '../repositories/interfaces/user-repository.js';
import type { SessionRepository } from '../repositories/interfaces/session-repository.js';
import { ok, err, type Result, ErrorCode, type User, type Session } from '@flagbase/types';
import { hashPassword, verifyPassword } from '../utils/password.js';
import crypto from 'crypto';

const SESSION_EXPIRY_DAYS = 7;

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository
  ) {}

  async register(
    email: string,
    password: string,
    name: string
  ): Promise<Result<Omit<User, 'passwordHash'>, ErrorCode>> {
    // Check if user already exists
    const existingUserResult = await this.userRepo.findByEmail(email);
    if (!existingUserResult.ok) {
      return existingUserResult;
    }
    if (existingUserResult.value !== null) {
      return err(ErrorCode.EMAIL_EXISTS);
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the user
    return this.userRepo.create({ email, name, passwordHash });
  }

  async login(
    email: string,
    password: string
  ): Promise<Result<{ user: Omit<User, 'passwordHash'>; session: Session }, ErrorCode>> {
    // Find user by email
    const userResult = await this.userRepo.findByEmail(email);
    if (!userResult.ok) {
      return userResult;
    }
    if (userResult.value === null) {
      // Generic error message to not reveal whether user exists
      return err(ErrorCode.INVALID_CREDENTIALS);
    }

    const user = userResult.value;

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      // Generic error message to not reveal whether user exists
      return err(ErrorCode.INVALID_CREDENTIALS);
    }

    // Generate session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    const sessionResult = await this.sessionRepo.create({
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    if (!sessionResult.ok) {
      return sessionResult;
    }

    // Return user without passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return ok({
      user: userWithoutPassword,
      session: sessionResult.value,
    });
  }

  async logout(sessionId: string): Promise<Result<void, ErrorCode>> {
    return this.sessionRepo.delete(sessionId);
  }

  async validateSession(
    sessionId: string
  ): Promise<Result<Omit<User, 'passwordHash'> | null, ErrorCode>> {
    // Find the session
    const sessionResult = await this.sessionRepo.findById(sessionId);
    if (!sessionResult.ok) {
      return sessionResult;
    }
    if (sessionResult.value === null) {
      return ok(null);
    }

    const session = sessionResult.value;

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await this.sessionRepo.delete(sessionId);
      return ok(null);
    }

    // Get the user
    const userResult = await this.userRepo.findById(session.userId);
    if (!userResult.ok) {
      return userResult;
    }

    return ok(userResult.value);
  }
}
