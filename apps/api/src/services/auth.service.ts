import { prisma } from '../config/database';
import { AuthError, ConflictError, ValidationError } from '../utils/errors';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  generateEmailToken, 
  generatePasswordResetToken 
} from '../utils/tokens';
import bcrypt from 'bcrypt';
import { sendEmail } from './email.service';
import { getEnv } from '../config/env';
import { google } from 'googleapis';
import { EncryptionService } from './encryption.service';

export class AuthService {
  static async register(data: any) {
    const { email, password, displayName } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const emailVerificationToken = generateEmailToken();
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user and related records in transaction
    const user = await prisma.$transaction(async (tx: any) => {
      // Find the free plan
      const freePlan = await tx.plan.findUnique({ where: { slug: 'free' } });
      
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          displayName,
          emailVerificationToken,
          emailVerificationExpiry,
          emailVerified: getEnv().NODE_ENV === 'development', // Auto-verify in development
          status: getEnv().NODE_ENV === 'development' ? 'ACTIVE' : 'PENDING_VERIFICATION',
          profile: {
            create: {}
          }
        }
      });

      if (freePlan) {
        // Auto-assign Free Plan
        const subscription = await tx.subscription.create({
          data: {
            userId: newUser.id,
            planId: freePlan.id,
            status: 'ACTIVE',
            billingCycle: 'MONTHLY',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            gateway: 'MANUAL',
            manuallyAssigned: true,
          }
        });

        // Create usage tracker based on plan limits
        const limits = freePlan.limits as any;
        await tx.subscriptionUsage.create({
          data: {
            subscriptionId: subscription.id,
            userId: newUser.id,
            creditsLimit: limits?.creditsPerMonth || 50,
            storageLimitBytes: BigInt((limits?.storageGb || 2) * 1024 * 1024 * 1024),
            exportsLimit: limits?.maxExportsPerMonth || 10,
            projectsLimit: limits?.maxProjects || 5,
            periodStart: new Date(),
            periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }
        });
      }

      return newUser;
    });

    // Send verification email (non-blocking — a failed email should never block account creation)
    const verificationLink = `${getEnv().APP_URL}/verify-email?token=${emailVerificationToken}`;
    sendEmail(email, 'Verify your DirectorByte email', 'verify-email', { verificationLink })
      .catch((err) => console.error('[AuthService.register] Failed to send verification email:', err.message));

    return { message: 'Check your email to verify your account' };
  }

  static async login(data: any, reqInfo: { ip: string, userAgent: string }) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ 
      where: { email }, 
      include: { 
        subscription: {
          include: { plan: true }
        } 
      } 
    });
    
    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    if (!user.emailVerified && getEnv().NODE_ENV !== 'development') {
      throw new AuthError('Please verify your email first');
    }

    if (user.status !== 'ACTIVE' && getEnv().NODE_ENV !== 'development') {
      throw new AuthError(`Account is ${user.status.toLowerCase()}`);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthError(`Account locked until ${user.lockedUntil.toISOString()}`);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash || '');
    if (!isValid) {
      // Handle lockout logic
      const attempts = user.loginAttempts + 1;
      const updates: any = { loginAttempts: attempts };
      
      // We'd normally use env config for maxAttempts, hardcoding 5 for now
      if (attempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
      }
      
      await prisma.user.update({ where: { id: user.id }, data: updates });
      throw new AuthError('Invalid email or password');
    }

    // Reset attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken();

    // Parse Expiry string '30d' roughly to Date
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        ipAddress: reqInfo.ip,
        userAgent: reqInfo.userAgent,
        expiresAt,
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        plan: user.subscription?.plan?.slug?.toUpperCase() || 'FREE',
        planId: user.subscription?.planId
      }
    };
  }

  static async refresh(refreshToken: string) {
    const session = await prisma.session.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      throw new AuthError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new AuthError('User account is not active');
    }

    const newAccessToken = generateAccessToken(user.id, user.role);
    
    // Update session with new token
    await prisma.session.update({
      where: { id: session.id },
      data: { token: newAccessToken, lastUsedAt: new Date() }
    });

    return { accessToken: newAccessToken };
  }

  static async logout(accessToken: string) {
    await prisma.session.deleteMany({
      where: { token: accessToken }
    });
    return { success: true };
  }

  static async logoutAll(userId: string) {
    const result = await prisma.session.deleteMany({
      where: { userId }
    });
    return { success: true, sessionsTerminated: result.count };
  }

  // Stubs for remaining flows
  static async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user || !user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      throw new AuthError('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        status: 'ACTIVE' // Activate user upon email verification
      }
    });

    return { success: true };
  }

  static async googleLogin(code: string, reqInfo: { ip: string, userAgent: string }) {
    if (!getEnv().GOOGLE_CLIENT_ID || !getEnv().GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth is not configured');
    }

    const oauth2Client = new google.auth.OAuth2(
      getEnv().GOOGLE_CLIENT_ID,
      getEnv().GOOGLE_CLIENT_SECRET,
      getEnv().GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const email = userInfo.data.email;
    if (!email) {
      throw new AuthError('Google account must have an email address');
    }

    let user = await prisma.user.findUnique({ 
      where: { email }, 
      include: { 
        subscription: {
          include: { plan: true }
        } 
      } 
    });

    if (!user) {
      // Auto-register via Google
      user = await prisma.$transaction(async (tx: any) => {
        const freePlan = await tx.plan.findUnique({ where: { slug: 'free' } });
        
        const newUser = await tx.user.create({
          data: {
            email,
            displayName: userInfo.data.name || email.split('@')[0],
            avatarUrl: userInfo.data.picture,
            emailVerified: true, // Google verifies it
            profile: { create: {} }
          }
        });

        if (freePlan) {
          const subscription = await tx.subscription.create({
            data: {
              userId: newUser.id,
              planId: freePlan.id,
              status: 'ACTIVE',
              billingCycle: 'MONTHLY',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              gateway: 'MANUAL',
              manuallyAssigned: true,
            }
          });

          const limits = freePlan.limits as any;
          await tx.subscriptionUsage.create({
            data: {
              subscriptionId: subscription.id,
              userId: newUser.id,
              creditsLimit: limits?.creditsPerMonth || 50,
              storageLimitBytes: BigInt((limits?.storageGb || 2) * 1024 * 1024 * 1024),
              exportsLimit: limits?.maxExportsPerMonth || 10,
              projectsLimit: limits?.maxProjects || 5,
              periodStart: new Date(),
              periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
          });
        }
        return newUser;
      }) as any;
    }

    if (user!.status !== 'ACTIVE') {
      throw new AuthError(`Account is ${user!.status.toLowerCase()}`);
    }

    // Save tokens if needed for Google Drive later
    const existingConnection = await prisma.storageConnection.findFirst({
      where: { userId: user!.id, provider: 'GOOGLE_DRIVE' }
    });

    if (existingConnection) {
      await prisma.storageConnection.update({
        where: { id: existingConnection.id },
        data: {
          encryptedAccessToken: tokens.access_token ? EncryptionService.encrypt(tokens.access_token) : undefined,
          encryptedRefreshToken: tokens.refresh_token ? EncryptionService.encrypt(tokens.refresh_token) : undefined,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
        }
      });
    } else {
      await prisma.storageConnection.create({
        data: {
          userId: user!.id,
          provider: 'GOOGLE_DRIVE',
          encryptedAccessToken: tokens.access_token ? EncryptionService.encrypt(tokens.access_token) : '',
          encryptedRefreshToken: tokens.refresh_token ? EncryptionService.encrypt(tokens.refresh_token) : '',
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000)
        }
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user!.id },
      data: { lastLoginAt: new Date() }
    });

    const accessToken = generateAccessToken(user!.id, user!.role);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user!.id,
        token: accessToken,
        refreshToken,
        ipAddress: reqInfo.ip,
        userAgent: reqInfo.userAgent,
        expiresAt,
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user!.id,
        email: user!.email,
        displayName: user!.displayName,
        role: user!.role,
        plan: user!.subscription?.plan?.slug?.toUpperCase() || 'FREE',
        planId: user!.subscription?.planId
      }
    };
  }

  static async updateProfile(userId: string, data: any) {
    const { displayName, name, avatarUrl, onboardingComplete } = data;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: displayName || name,
        avatarUrl,
        onboardingComplete: onboardingComplete === undefined ? undefined : onboardingComplete,
      },
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      onboardingComplete: updatedUser.onboardingComplete,
      role: updatedUser.role,
      plan: updatedUser.subscription?.plan?.slug?.toUpperCase() || 'FREE',
      planId: updatedUser.subscription?.planId
    };
  }
}
