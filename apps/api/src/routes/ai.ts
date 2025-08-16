import { Router, Response } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';
import { bodyScanService, churnPredictionService } from '../services/ai.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting for AI endpoints (more restrictive due to computational cost)
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { message: 'Too many AI requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const bodyScanSchema = z.object({
  memberId: z.string().uuid(),
  imageData: z.string().min(1000), // Base64 image should be substantial
  height: z.number().min(100).max(250), // cm
  weight: z.number().min(30).max(300), // kg
  age: z.number().min(13).max(100),
  gender: z.enum(['male', 'female']),
});

const churnPredictionSchema = z.object({
  memberId: z.string().uuid(),
  features: z.object({
    visitFrequency: z.number().min(0).max(20).optional(),
    lastVisitDays: z.number().min(0).max(365).optional(),
    membershipDuration: z.number().min(0).max(3650).optional(),
    classAttendance: z.number().min(0).max(1).optional(),
    paymentHistory: z.number().min(0).max(1).optional(),
  }).optional(),
});

// POST /v1/ai/body-scan - Process body scan image
router.post('/body-scan',
  aiRateLimit,
  authRequired(['staff', 'manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const validation = bodyScanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: 'Validation error',
          errors: validation.error.errors,
        });
      }

      const { memberId, imageData, height, weight, age, gender } = validation.data;
      const companyId = req.tenant!.companyId;

      // Verify member belongs to the company
      const { PrismaClient } = await import('../generated/prisma/index.js');
      const prisma = new PrismaClient();
      
      const member = await prisma.member.findFirst({
        where: {
          id: memberId,
          companyId: companyId,
        },
      });

      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Process body scan
      const scanResult = await bodyScanService.processBodyScan({
        memberId,
        imageData,
        height,
        weight,
        age,
        gender,
      });

      // Track analytics
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('ai.body_scan_completed', {
            memberId,
            companyId,
            poseQuality: scanResult.poseQuality,
            confidence: scanResult.confidence,
            bmi: scanResult.bmi,
          });
        });
      }

      res.json({
        success: true,
        scan: scanResult,
      });
    } catch (error) {
      console.error('Body scan error:', error);
      const message = error instanceof Error ? error.message : 'Failed to process body scan';
      res.status(500).json({ message });
    }
  }
);

// POST /v1/ai/churn-prediction - Predict member churn risk
router.post('/churn-prediction',
  aiRateLimit,
  authRequired(['manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const validation = churnPredictionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: 'Validation error',
          errors: validation.error.errors,
        });
      }

      const { memberId, features } = validation.data;
      const companyId = req.tenant!.companyId;

      // Verify member belongs to the company
      const { PrismaClient } = await import('../generated/prisma/index.js');
      const prisma = new PrismaClient();
      
      const member = await prisma.member.findFirst({
        where: {
          id: memberId,
          companyId: companyId,
        },
      });

      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Predict churn risk
      const prediction = await churnPredictionService.predictChurnRisk({
        memberId,
        features,
      });

      // Track analytics
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('ai.churn_prediction_generated', {
            memberId,
            companyId,
            churnRisk: prediction.churnRisk,
            churnProbability: prediction.churnProbability,
          });
        });
      }

      res.json({
        success: true,
        prediction,
      });
    } catch (error) {
      console.error('Churn prediction error:', error);
      const message = error instanceof Error ? error.message : 'Failed to predict churn risk';
      res.status(500).json({ message });
    }
  }
);

// GET /v1/ai/member-insights/:memberId - Get comprehensive AI insights for a member
router.get('/member-insights/:memberId',
  authRequired(['staff', 'manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const memberId = req.params.memberId;
      const companyId = req.tenant!.companyId;

      // Verify member belongs to the company
      const { PrismaClient } = await import('../generated/prisma/index.js');
      const prisma = new PrismaClient();
      
      const member = await prisma.member.findFirst({
        where: {
          id: memberId,
          companyId: companyId,
        },
        include: {
          memberships: {
            include: {
              visits: {
                orderBy: { checkIn: 'desc' },
                take: 10,
              },
            },
          },
        },
      });

      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Get churn prediction
      const churnPrediction = await churnPredictionService.predictChurnRisk({
        memberId,
      });

      // Calculate engagement metrics
      const membership = member.memberships[0];
      const visits = membership?.visits || [];
      const now = new Date();
      
      const lastVisit = visits[0]?.checkIn;
      const daysSinceLastVisit = lastVisit 
        ? Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const visitsThisMonth = visits.filter(visit => {
        const visitDate = new Date(visit.checkIn);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return visitDate >= monthAgo;
      }).length;

      // Generate personalized recommendations
      const recommendations = generatePersonalizedRecommendations(
        member,
        churnPrediction,
        visitsThisMonth,
        daysSinceLastVisit
      );

      const insights = {
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          status: member.status,
        },
        churnPrediction,
        engagement: {
          visitsThisMonth,
          daysSinceLastVisit,
          membershipDuration: membership ? Math.floor(
            (now.getTime() - membership.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ) : 0,
        },
        recommendations,
        lastBodyScan: null, // Would fetch from body scan records
      };

      res.json({
        success: true,
        insights,
      });
    } catch (error) {
      console.error('Member insights error:', error);
      const message = error instanceof Error ? error.message : 'Failed to get member insights';
      res.status(500).json({ message });
    }
  }
);

// Helper function to generate personalized recommendations
function generatePersonalizedRecommendations(
  member: any,
  churnPrediction: any,
  visitsThisMonth: number,
  daysSinceLastVisit: number | null
): string[] {
  const recommendations: string[] = [];

  // Churn-based recommendations
  if (churnPrediction.churnRisk === 'high') {
    recommendations.push('🚨 Contactar inmediatamente - Alto riesgo de cancelación');
    recommendations.push('💰 Ofrecer promoción especial o descuento');
    recommendations.push('👨‍💼 Programar sesión con entrenador personal');
  } else if (churnPrediction.churnRisk === 'medium') {
    recommendations.push('📞 Llamada de seguimiento recomendada');
    recommendations.push('🎯 Invitar a clase grupal o evento especial');
  }

  // Visit frequency recommendations
  if (visitsThisMonth < 4) {
    recommendations.push('📅 Ayudar a establecer rutina de ejercicio regular');
    recommendations.push('🏃‍♀️ Sugerir clases que se adapten a su horario');
  } else if (visitsThisMonth > 15) {
    recommendations.push('⭐ Miembro muy activo - candidato para programa VIP');
    recommendations.push('👥 Invitar a referir amigos con incentivo');
  }

  // Recency recommendations
  if (daysSinceLastVisit && daysSinceLastVisit > 7) {
    recommendations.push('💌 Enviar mensaje motivacional personalizado');
    recommendations.push('🎁 Ofrecer clase gratuita de bienvenida');
  }

  // General engagement recommendations
  if (recommendations.length === 0) {
    recommendations.push('✅ Miembro en buen estado - mantener engagement actual');
    recommendations.push('📊 Considerar para programa de embajadores');
  }

  return recommendations;
}

// GET /v1/ai/analytics/churn-overview - Get company-wide churn analytics
router.get('/analytics/churn-overview',
  authRequired(['manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const companyId = req.tenant!.companyId;

      // Get all active members
      const { PrismaClient } = await import('../generated/prisma/index.js');
      const prisma = new PrismaClient();
      
      const members = await prisma.member.findMany({
        where: {
          companyId: companyId,
          status: 'active',
        },
        include: {
          memberships: {
            where: { status: 'active' },
            include: {
              visits: {
                orderBy: { checkIn: 'desc' },
                take: 30,
              },
            },
          },
        },
      });

      // Calculate churn risk for all members (in production, this would be cached)
      const churnAnalytics = {
        totalMembers: members.length,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        averageChurnProbability: 0,
        riskFactors: {} as Record<string, number>,
      };

      let totalProbability = 0;

      for (const member of members.slice(0, 20)) { // Limit for demo
        try {
          const prediction = await churnPredictionService.predictChurnRisk({
            memberId: member.id,
          });

          totalProbability += prediction.churnProbability;

          switch (prediction.churnRisk) {
            case 'high':
              churnAnalytics.highRisk++;
              break;
            case 'medium':
              churnAnalytics.mediumRisk++;
              break;
            case 'low':
              churnAnalytics.lowRisk++;
              break;
          }

          // Count risk factors
          prediction.riskFactors.forEach(factor => {
            churnAnalytics.riskFactors[factor] = (churnAnalytics.riskFactors[factor] || 0) + 1;
          });
        } catch (error) {
          console.error(`Error predicting churn for member ${member.id}:`, error);
        }
      }

      churnAnalytics.averageChurnProbability = totalProbability / Math.min(members.length, 20);

      res.json({
        success: true,
        analytics: churnAnalytics,
      });
    } catch (error) {
      console.error('Churn analytics error:', error);
      const message = error instanceof Error ? error.message : 'Failed to get churn analytics';
      res.status(500).json({ message });
    }
  }
);

export default router;
