/**
 * Email Verification Routes
 * Handle email verification flow
 */

import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate } from '../../middleware/auth.js';
import { NotFoundError, ValidationError } from '../../types/errors.js';
import crypto from 'crypto';

const router = Router();

// Send verification email
router.post('/send-verification', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.emailVerified) {
      throw new ValidationError('Email is already verified');
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Store token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires: expiresAt,
      },
    });

    // TODO: Send email with verification link
    // For now, return the token in response (in production, send email)
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    res.json({
      success: true,
      message: 'Verification email sent',
      data: {
        verificationLink, // Remove this in production
      },
    });
  } catch (error) {
    next(error);
  }
});

// Verify email with token
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Token is required');
    }

    // Find token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      throw new NotFoundError('Invalid verification token');
    }

    // Check if expired
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      throw new ValidationError('Verification token has expired');
    }

    // Update user
    const user = await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: true },
    });

    // Delete token
    await prisma.verificationToken.delete({
      where: { token },
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Resend verification email
router.post('/resend-verification', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.emailVerified) {
      throw new ValidationError('Email is already verified');
    }

    // Delete old tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires: expiresAt,
      },
    });

    // TODO: Send email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    res.json({
      success: true,
      message: 'Verification email resent',
      data: {
        verificationLink, // Remove this in production
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
