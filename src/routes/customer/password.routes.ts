/**
 * Password Reset Routes
 * Handle forgot password and reset password flow
 */

import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { NotFoundError, ValidationError } from '../../types/errors.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = Router();

// Request password reset
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent',
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    // Delete old password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Store token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires: expiresAt,
      },
    });

    // TODO: Send email with reset link
    // For now, return the token in response (in production, send email)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent',
      data: {
        resetLink, // Remove this in production
      },
    });
  } catch (error) {
    next(error);
  }
});

// Verify reset token
router.post('/verify-reset-token', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Token is required');
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!resetToken) {
      throw new NotFoundError('Invalid reset token');
    }

    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      throw new ValidationError('Reset token has expired');
    }

    res.json({
      success: true,
      data: {
        email: resetToken.user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Reset password with token
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ValidationError('Token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new NotFoundError('Invalid reset token');
    }

    // Check if expired
    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      throw new ValidationError('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Delete token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    // Delete all sessions for this user (force re-login)
    await prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
