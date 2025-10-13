/**
 * AI Routes (Customer Panel)
 * AI-powered menu generation and content creation
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/authorize.js';
import { Role } from '@prisma/client';
import { ResponseFormatter } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AIService } from '../../services/ai.service.js';
import { CreditService } from '../../services/credit.service.js';
import { prisma } from '../../config/database.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /:orgId/ai/generate-description
 * Generate item description from title
 */
router.post(
  '/:orgId/ai/generate-description',
  requireRole(Role.EDITOR),
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const userId = req.user!.userId;

    const schema = z.object({
      itemName: z.string().min(1),
      category: z.string().optional(),
      cuisine: z.string().optional(),
      language: z.string().default('en'),
    });

    const { itemName, category, cuisine, language } = schema.parse(req.body);

    // Estimate credits needed (rough estimate)
    const estimatedCredits = AIService.calculateCreditCost(200); // ~200 tokens

    // Check credits
    const creditCheck = await CreditService.checkCredits(orgId, estimatedCredits);
    if (!creditCheck.hasEnoughCredits) {
      return ResponseFormatter.error(
        res,
        'Insufficient Credits',
        `Insufficient AI credits. Required: ${estimatedCredits}, Available: ${creditCheck.currentBalance}`,
        402
      );
    }

    // Generate description
    const result = await AIService.generateItemDescription(
      itemName,
      category,
      cuisine,
      language
    );

    // Calculate actual credits used
    const creditsUsed = AIService.calculateCreditCost(result.tokensUsed);

    // Deduct credits
    await CreditService.deductCredits(orgId, userId, creditsUsed, 'DESCRIPTION', {
      itemName,
      tokensUsed: result.tokensUsed,
      model: result.model,
    });

    // Save to history
    await prisma.aIGeneratedContent.create({
      data: {
        orgId,
        userId,
        type: 'DESCRIPTION',
        prompt: `Generate description for: ${itemName}`,
        response: result.content,
        tokensUsed: result.tokensUsed,
        approved: false,
      },
    });

    return ResponseFormatter.success(res, {
      description: result.content,
      creditsUsed,
      tokensUsed: result.tokensUsed,
      remainingCredits: creditCheck.currentBalance - creditsUsed,
    });
  })
);

/**
 * POST /:orgId/ai/translate-item
 * Translate menu item
 */
router.post(
  '/:orgId/ai/translate-item',
  requireRole(Role.EDITOR),
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const userId = req.user!.userId;

    const schema = z.object({
      itemName: z.string().min(1),
      description: z.string().min(1),
      fromLanguage: z.string(),
      toLanguage: z.string(),
    });

    const { itemName, description, fromLanguage, toLanguage } = schema.parse(req.body);

    // Estimate credits needed
    const estimatedCredits = AIService.calculateCreditCost(300);

    // Check credits
    const creditCheck = await CreditService.checkCredits(orgId, estimatedCredits);
    if (!creditCheck.hasEnoughCredits) {
      return ResponseFormatter.error(
        res,
        'Insufficient Credits',
        `Insufficient AI credits. Required: ${estimatedCredits}, Available: ${creditCheck.currentBalance}`,
        402
      );
    }

    // Translate
    const result = await AIService.translateMenuItem(
      itemName,
      description,
      fromLanguage,
      toLanguage
    );

    // Calculate credits used
    const creditsUsed = AIService.calculateCreditCost(result.tokensUsed);

    // Deduct credits
    await CreditService.deductCredits(orgId, userId, creditsUsed, 'TRANSLATION', {
      itemName,
      fromLanguage,
      toLanguage,
      tokensUsed: result.tokensUsed,
      model: result.model,
    });

    // Save to history
    await prisma.aIGeneratedContent.create({
      data: {
        orgId,
        userId,
        type: 'TRANSLATION',
        prompt: `Translate ${itemName} from ${fromLanguage} to ${toLanguage}`,
        response: result.content,
        tokensUsed: result.tokensUsed,
        approved: false,
      },
    });

    return ResponseFormatter.success(res, {
      translation: result.content,
      creditsUsed,
      tokensUsed: result.tokensUsed,
      remainingCredits: creditCheck.currentBalance - creditsUsed,
    });
  })
);

/**
 * POST /:orgId/ai/generate-menu
 * Generate complete menu
 */
router.post(
  '/:orgId/ai/generate-menu',
  requireRole(Role.EDITOR),
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const userId = req.user!.userId;

    const schema = z.object({
      restaurantName: z.string().min(1),
      cuisineType: z.string().min(1),
      categories: z.array(z.string()).min(1),
      itemsPerCategory: z.number().int().min(1).max(10).default(5),
      language: z.string().default('en'),
    });

    const data = schema.parse(req.body);

    // Estimate credits needed (this uses GPT-4, more expensive)
    const estimatedCredits = AIService.calculateCreditCost(2000);

    // Check credits
    const creditCheck = await CreditService.checkCredits(orgId, estimatedCredits);
    if (!creditCheck.hasEnoughCredits) {
      return ResponseFormatter.error(
        res,
        'Insufficient Credits',
        `Insufficient AI credits. Required: ${estimatedCredits}, Available: ${creditCheck.currentBalance}`,
        402
      );
    }

    // Generate menu
    const result = await AIService.generateCompleteMenu(
      data.restaurantName,
      data.cuisineType,
      data.categories,
      data.itemsPerCategory,
      data.language
    );

    // Calculate credits used
    const creditsUsed = AIService.calculateCreditCost(result.tokensUsed);

    // Deduct credits
    await CreditService.deductCredits(orgId, userId, creditsUsed, 'MENU_GEN', {
      restaurantName: data.restaurantName,
      cuisineType: data.cuisineType,
      categoriesCount: data.categories.length,
      tokensUsed: result.tokensUsed,
      model: result.model,
    });

    // Save to history
    await prisma.aIGeneratedContent.create({
      data: {
        orgId,
        userId,
        type: 'MENU',
        prompt: `Generate menu for ${data.restaurantName} (${data.cuisineType})`,
        response: result.content,
        tokensUsed: result.tokensUsed,
        approved: false,
      },
    });

    return ResponseFormatter.success(res, {
      menu: JSON.parse(result.content),
      creditsUsed,
      tokensUsed: result.tokensUsed,
      remainingCredits: creditCheck.currentBalance - creditsUsed,
    });
  })
);

/**
 * POST /:orgId/ai/generate-image-prompt
 * Generate image prompt for item
 */
router.post(
  '/:orgId/ai/generate-image-prompt',
  requireRole(Role.EDITOR),
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const userId = req.user!.userId;

    const schema = z.object({
      itemName: z.string().min(1),
      description: z.string().min(1),
      cuisineType: z.string().optional(),
    });

    const { itemName, description, cuisineType } = schema.parse(req.body);

    // Estimate credits needed
    const estimatedCredits = AIService.calculateCreditCost(200);

    // Check credits
    const creditCheck = await CreditService.checkCredits(orgId, estimatedCredits);
    if (!creditCheck.hasEnoughCredits) {
      return ResponseFormatter.error(
        res,
        'Insufficient Credits',
        `Insufficient AI credits. Required: ${estimatedCredits}, Available: ${creditCheck.currentBalance}`,
        402
      );
    }

    // Generate image prompt
    const result = await AIService.generateImagePrompt(itemName, description, cuisineType);

    // Calculate credits used
    const creditsUsed = AIService.calculateCreditCost(result.tokensUsed);

    // Deduct credits
    await CreditService.deductCredits(orgId, userId, creditsUsed, 'IMAGE_PROMPT', {
      itemName,
      tokensUsed: result.tokensUsed,
      model: result.model,
    });

    // Save to history
    await prisma.aIGeneratedContent.create({
      data: {
        orgId,
        userId,
        type: 'PROMPT',
        prompt: `Generate image prompt for: ${itemName}`,
        response: result.content,
        tokensUsed: result.tokensUsed,
        approved: false,
      },
    });

    return ResponseFormatter.success(res, {
      imagePrompt: result.content,
      creditsUsed,
      tokensUsed: result.tokensUsed,
      remainingCredits: creditCheck.currentBalance - creditsUsed,
    });
  })
);

/**
 * POST /:orgId/ai/optimize-description
 * Optimize existing description
 */
router.post(
  '/:orgId/ai/optimize-description',
  requireRole(Role.EDITOR),
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const userId = req.user!.userId;

    const schema = z.object({
      itemName: z.string().min(1),
      currentDescription: z.string().min(1),
      language: z.string().default('en'),
    });

    const { itemName, currentDescription, language } = schema.parse(req.body);

    // Estimate credits needed
    const estimatedCredits = AIService.calculateCreditCost(250);

    // Check credits
    const creditCheck = await CreditService.checkCredits(orgId, estimatedCredits);
    if (!creditCheck.hasEnoughCredits) {
      return ResponseFormatter.error(
        res,
        'Insufficient Credits',
        `Insufficient AI credits. Required: ${estimatedCredits}, Available: ${creditCheck.currentBalance}`,
        402
      );
    }

    // Optimize description
    const result = await AIService.optimizeDescription(itemName, currentDescription, language);

    // Calculate credits used
    const creditsUsed = AIService.calculateCreditCost(result.tokensUsed);

    // Deduct credits
    await CreditService.deductCredits(orgId, userId, creditsUsed, 'OPTIMIZATION', {
      itemName,
      tokensUsed: result.tokensUsed,
      model: result.model,
    });

    // Save to history
    await prisma.aIGeneratedContent.create({
      data: {
        orgId,
        userId,
        type: 'DESCRIPTION',
        prompt: `Optimize description for: ${itemName}`,
        response: result.content,
        tokensUsed: result.tokensUsed,
        approved: false,
      },
    });

    return ResponseFormatter.success(res, {
      optimizedDescription: result.content,
      creditsUsed,
      tokensUsed: result.tokensUsed,
      remainingCredits: creditCheck.currentBalance - creditsUsed,
    });
  })
);

/**
 * GET /:orgId/ai/credits
 * Get AI credit balance and info
 */
router.get(
  '/:orgId/ai/credits',
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;

    const balance = await CreditService.getBalance(orgId);

    return ResponseFormatter.success(res, balance);
  })
);

/**
 * GET /:orgId/ai/transactions
 * Get credit transaction history
 */
router.get(
  '/:orgId/ai/transactions',
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const { limit, offset, type, feature } = req.query;

    const history = await CreditService.getTransactionHistory(orgId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      type: type as string,
      feature: feature as string,
    });

    return ResponseFormatter.success(res, history);
  })
);

/**
 * GET /:orgId/ai/usage-stats
 * Get credit usage statistics
 */
router.get(
  '/:orgId/ai/usage-stats',
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const { days } = req.query;

    const stats = await CreditService.getUsageStats(
      orgId,
      days ? parseInt(days as string) : undefined
    );

    return ResponseFormatter.success(res, stats);
  })
);

/**
 * GET /:orgId/ai/packages
 * Get available credit packages
 */
router.get(
  '/:orgId/ai/packages',
  asyncHandler(async (_req, res) => {
    const packages = await CreditService.getAvailablePackages();

    return ResponseFormatter.success(res, packages);
  })
);

/**
 * POST /:orgId/ai/purchase-package
 * Purchase credit package
 */
router.post(
  '/:orgId/ai/purchase-package',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const userId = req.user!.userId;

    const schema = z.object({
      packageId: z.string(),
    });

    const { packageId } = schema.parse(req.body);

    await CreditService.purchasePackage(orgId, userId, packageId);

    const balance = await CreditService.getBalance(orgId);

    return ResponseFormatter.success(res, balance, 'Credits purchased successfully');
  })
);

/**
 * GET /:orgId/ai/history
 * Get AI generated content history
 */
router.get(
  '/:orgId/ai/history',
  asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const { limit = '20', offset = '0', type } = req.query;

    const where: any = { orgId };
    if (type) where.type = type;

    const [content, total] = await Promise.all([
      prisma.aIGeneratedContent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.aIGeneratedContent.count({ where }),
    ]);

    return ResponseFormatter.success(res, {
      content,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total,
      },
    });
  })
);

export default router;
