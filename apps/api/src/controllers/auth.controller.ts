import { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import { AuthService } from '../services/auth.service';
import { response } from '../utils/response';
import { getEnv } from '../config/env';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      return response.created(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const reqInfo = { ip: req.ip || 'unknown', userAgent: req.headers['user-agent'] || 'unknown' };
      const { accessToken, refreshToken, user: userData } = await AuthService.login(req.body, reqInfo);

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: getEnv().NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return response.ok(res, { accessToken, user: userData });
    } catch (error) {
      next(error);
    }
  }

  // GET /auth/google — redirect browser to Google's consent screen
  static async googleRedirect(req: Request, res: Response, next: NextFunction) {
    try {
      if (!getEnv().GOOGLE_CLIENT_ID || !getEnv().GOOGLE_CLIENT_SECRET) {
        return response.badRequest(res, 'OAUTH_NOT_CONFIGURED', 'Google OAuth is not configured on this server.');
      }
      const oauth2Client = new google.auth.OAuth2(
        getEnv().GOOGLE_CLIENT_ID,
        getEnv().GOOGLE_CLIENT_SECRET,
        getEnv().GOOGLE_REDIRECT_URI
      );
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/drive.file',
        ],
        prompt: 'consent',
      });
      return res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  // GET /auth/google/callback — Google redirects here with ?code=, we redirect to frontend with token
  static async googleCallback(req: Request, res: Response, next: NextFunction) {
    const FRONTEND_URL = getEnv().APP_URL || 'http://localhost:3000';
    try {
      const { code, error } = req.query;

      if (error) {
        return res.redirect(`${FRONTEND_URL}/oauth/callback?error=${error}`);
      }

      if (!code || typeof code !== 'string') {
        return res.redirect(`${FRONTEND_URL}/oauth/callback?error=missing_code`);
      }

      const reqInfo = { ip: req.ip || 'unknown', userAgent: req.headers['user-agent'] || 'unknown' };
      const result = await AuthService.googleLogin(code, reqInfo);

      return res.redirect(`${FRONTEND_URL}/oauth/callback?token=${result.accessToken}`);
    } catch (error) {
      console.error('[GoogleCallback] error:', error);
      return res.redirect(`${FRONTEND_URL}/oauth/callback?error=auth_failed`);
    }
  }

  // POST /auth/google — legacy endpoint kept for direct API calls
  static async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      if (!code) return response.badRequest(res, 'MISSING_CODE', 'Authorization code is required');

      const reqInfo = { ip: req.ip || 'unknown', userAgent: req.headers['user-agent'] || 'unknown' };
      const result = await AuthService.googleLogin(code, reqInfo);
      return response.ok(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      if (!refreshToken) return response.unauthorized(res, 'Session expired. Please log in again.');
      
      const { accessToken } = await AuthService.refresh(refreshToken);
      return response.ok(res, { accessToken });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return response.unauthorized(res);
      
      const token = authHeader.split(' ')[1];
      await AuthService.logout(token);
      
      // Clear cookie
      res.clearCookie('refreshToken');
      
      return response.ok(res, { success: true });
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return response.unauthorized(res);
      const result = await AuthService.logoutAll(req.user.id);
      return response.ok(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') return response.badRequest(res, 'MISSING_TOKEN', 'Token is required');

      await AuthService.verifyEmail(token);
      // In a real app, you might redirect to frontend login page
      return response.ok(res, { message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  }
}
