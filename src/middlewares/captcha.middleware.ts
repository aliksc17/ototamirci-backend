import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';

/**
 * Middleware to verify Google reCAPTCHA v2 token.
 * Expects `captchaToken` in the request body.
 * If RECAPTCHA_SECRET_KEY is not set, skips verification (dev mode).
 */
export const verifyCaptcha = async (req: Request, res: Response, next: NextFunction) => {
  // Skip captcha in development if no secret key is configured
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn('⚠️ reCAPTCHA secret key not set — skipping verification');
    return next();
  }

  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({
      success: false,
      message: 'reCAPTCHA doğrulaması gerekli. Lütfen "Ben robot değilim" kutusunu işaretleyin.'
    });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      }
    );

    if (!response.data.success) {
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA doğrulaması başarısız. Lütfen tekrar deneyin.'
      });
    }

    next();
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    // Don't block registration if Google API is down
    next();
  }
};
