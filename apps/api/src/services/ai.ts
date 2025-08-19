import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

export interface BodyScanRequest {
  memberId: string;
  imageData: string; // Base64 encoded image
  height: number; // in cm
  weight: number; // in kg
  age: number;
  gender: 'male' | 'female';
}

export interface BodyScanResult {
  scanId: string;
  bodyFatPercentage: number;
  muscleMass: number;
  bmi: number;
  recommendations: string[];
  poseQuality: 'excellent' | 'good' | 'fair' | 'poor';
  confidence: number;
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
}

export interface ChurnPredictionRequest {
  memberId: string;
  features?: {
    visitFrequency?: number;
    lastVisitDays?: number;
    membershipDuration?: number;
    classAttendance?: number;
    paymentHistory?: number;
  };
}

export interface ChurnPredictionResult {
  memberId: string;
  churnRisk: 'low' | 'medium' | 'high';
  churnProbability: number;
  riskFactors: string[];
  recommendations: string[];
  nextPredictedAction: string;
}

/**
 * AI Body Scan Service
 * Processes smartphone camera images to estimate body composition
 */
export class BodyScanService {
  /**
   * Process body scan image and return analysis
   */
  async processBodyScan(request: BodyScanRequest): Promise<BodyScanResult> {
    try {
      // For MVP, we'll use rule-based calculations with some AI-like features
      // In production, this would integrate with TensorFlow.js or cloud AI services

      const { height, weight, age, gender, imageData, memberId } = request;

      // Basic BMI calculation
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);

      // Estimate body fat percentage using Deurenberg formula
      const bodyFatPercentage = this.estimateBodyFat(bmi, age, gender);

      // Estimate muscle mass
      const muscleMass = this.estimateMuscleMass(weight, bodyFatPercentage);

      // Analyze pose quality (mock implementation)
      const poseQuality = this.analyzePoseQuality(imageData);

      // Generate recommendations
      const recommendations = this.generateRecommendations(bmi, bodyFatPercentage, age, gender);

      // Mock measurements (in production, these would come from computer vision)
      const measurements = this.estimateMeasurements(height, weight, gender);

      const scanResult: BodyScanResult = {
        scanId: `scan_${Date.now()}_${memberId}`,
        bodyFatPercentage: Math.round(bodyFatPercentage * 10) / 10,
        muscleMass: Math.round(muscleMass * 10) / 10,
        bmi: Math.round(bmi * 10) / 10,
        recommendations,
        poseQuality,
        confidence: this.calculateConfidence(poseQuality),
        measurements,
      };

      // Store scan result in database
      await this.storeScanResult(memberId, scanResult);

      return scanResult;
    } catch (error) {
      console.error('Error processing body scan:', error);
      throw new Error('Failed to process body scan');
    }
  }

  private estimateBodyFat(bmi: number, age: number, gender: string): number {
    // Deurenberg formula for body fat estimation
    let bodyFat: number;

    if (gender === 'male') {
      bodyFat = 1.2 * bmi + 0.23 * age - 16.2;
    } else {
      bodyFat = 1.2 * bmi + 0.23 * age - 5.4;
    }

    // Ensure reasonable bounds
    return Math.max(5, Math.min(50, bodyFat));
  }

  private estimateMuscleMass(weight: number, bodyFatPercentage: number): number {
    const fatMass = weight * (bodyFatPercentage / 100);
    const leanMass = weight - fatMass;
    // Muscle mass is approximately 40-50% of lean mass
    return leanMass * 0.45;
  }

  private analyzePoseQuality(imageData: string): 'excellent' | 'good' | 'fair' | 'poor' {
    // Mock pose analysis - in production, this would use computer vision
    // For now, randomly assign quality based on image data length (proxy for quality)
    const dataLength = imageData.length;

    if (dataLength > 100000) return 'excellent';
    if (dataLength > 75000) return 'good';
    if (dataLength > 50000) return 'fair';
    return 'poor';
  }

  private generateRecommendations(
    bmi: number,
    bodyFat: number,
    age: number,
    gender: string
  ): string[] {
    const recommendations: string[] = [];

    // BMI-based recommendations
    if (bmi < 18.5) {
      recommendations.push('Considera aumentar tu ingesta calórica con alimentos nutritivos');
      recommendations.push('Enfócate en ejercicios de fuerza para ganar masa muscular');
    } else if (bmi > 25) {
      recommendations.push('Incorpora más ejercicio cardiovascular a tu rutina');
      recommendations.push('Considera reducir la ingesta calórica de manera saludable');
    }

    // Body fat recommendations
    const idealBodyFat = gender === 'male' ? 15 : 25;
    if (bodyFat > idealBodyFat + 5) {
      recommendations.push(
        'Combina entrenamiento de fuerza con cardio para reducir grasa corporal'
      );
      recommendations.push('Consulta con un nutriólogo para optimizar tu alimentación');
    }

    // Age-specific recommendations
    if (age > 40) {
      recommendations.push('Incluye ejercicios de flexibilidad y movilidad en tu rutina');
      recommendations.push('Considera suplementos de calcio y vitamina D');
    }

    return recommendations;
  }

  private estimateMeasurements(height: number, weight: number, gender: string) {
    // Mock measurements based on anthropometric data
    // In production, these would come from computer vision analysis
    const heightFactor = height / 170; // Normalize to average height
    const weightFactor = weight / 70; // Normalize to average weight

    if (gender === 'male') {
      return {
        chest: Math.round(95 * heightFactor * Math.sqrt(weightFactor)),
        waist: Math.round(85 * heightFactor * Math.sqrt(weightFactor)),
        hips: Math.round(95 * heightFactor * Math.sqrt(weightFactor)),
        arms: Math.round(32 * heightFactor * Math.sqrt(weightFactor)),
        thighs: Math.round(55 * heightFactor * Math.sqrt(weightFactor)),
      };
    } else {
      return {
        chest: Math.round(88 * heightFactor * Math.sqrt(weightFactor)),
        waist: Math.round(75 * heightFactor * Math.sqrt(weightFactor)),
        hips: Math.round(98 * heightFactor * Math.sqrt(weightFactor)),
        arms: Math.round(28 * heightFactor * Math.sqrt(weightFactor)),
        thighs: Math.round(52 * heightFactor * Math.sqrt(weightFactor)),
      };
    }
  }

  private calculateConfidence(poseQuality: string): number {
    switch (poseQuality) {
      case 'excellent':
        return 0.95;
      case 'good':
        return 0.85;
      case 'fair':
        return 0.7;
      case 'poor':
        return 0.5;
      default:
        return 0.5;
    }
  }

  private async storeScanResult(memberId: string, result: BodyScanResult): Promise<void> {
    // Store in database for historical tracking
    // This would be implemented with a proper BodyScan model in Prisma
    console.log(`Storing scan result for member ${memberId}:`, result.scanId);

    // For now, we'll just log it. In production, this would save to database:
    // await prisma.bodyScan.create({
    //   data: {
    //     id: result.scanId,
    //     memberId,
    //     bodyFatPercentage: result.bodyFatPercentage,
    //     muscleMass: result.muscleMass,
    //     bmi: result.bmi,
    //     poseQuality: result.poseQuality,
    //     confidence: result.confidence,
    //     measurements: result.measurements,
    //     recommendations: result.recommendations,
    //   }
    // });
  }
}

/**
 * AI Churn Prediction Service
 * Predicts member churn risk using machine learning
 */
export class ChurnPredictionService {
  /**
   * Predict churn risk for a member
   */
  async predictChurnRisk(request: ChurnPredictionRequest): Promise<ChurnPredictionResult> {
    try {
      const { memberId } = request;

      // Get member data and calculate features
      const features = request.features || (await this.extractFeatures(memberId));

      // Calculate churn probability using rule-based model
      // In production, this would use a trained ML model
      const churnProbability = this.calculateChurnProbability(features);

      // Determine risk level
      const churnRisk = this.categorizeRisk(churnProbability);

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(features);

      // Generate recommendations
      const recommendations = this.generateChurnRecommendations(churnRisk, riskFactors);

      // Predict next action
      const nextPredictedAction = this.predictNextAction(features, churnRisk);

      return {
        memberId,
        churnRisk,
        churnProbability: Math.round(churnProbability * 100) / 100,
        riskFactors,
        recommendations,
        nextPredictedAction,
      };
    } catch (error) {
      console.error('Error predicting churn risk:', error);
      throw new Error('Failed to predict churn risk');
    }
  }

  private async extractFeatures(memberId: string) {
    // Extract comprehensive features from database

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: {
          include: {
            visits: {
              orderBy: { checkIn: 'desc' },
              take: 90, // Last 90 visits for better analysis
            },
            bookings: {
              orderBy: { createdAt: 'desc' },
              take: 50, // Recent bookings
            },
          },
        },
      },
    });

    if (!member || !member.memberships[0]) {
      throw new Error('Member or membership not found');
    }

    const membership = member.memberships[0];
    const visits = membership.visits;
    const bookings = membership.bookings || [];

    // Calculate temporal features
    const now = new Date();
    const membershipStart = membership.createdAt;
    const membershipDuration = Math.floor(
      (now.getTime() - membershipStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const lastVisit = visits[0]?.checkIn;
    const lastVisitDays = lastVisit
      ? Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Visit frequency analysis
    const visitFrequency = (visits.length / Math.max(membershipDuration, 1)) * 7; // visits per week

    // Visit pattern analysis (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentVisits = visits.filter(v => new Date(v.checkIn) >= thirtyDaysAgo).length;
    const previousVisits = visits.filter(v => {
      const visitDate = new Date(v.checkIn);
      return visitDate >= sixtyDaysAgo && visitDate < thirtyDaysAgo;
    }).length;

    const visitTrend = previousVisits > 0 ? (recentVisits - previousVisits) / previousVisits : 0;

    // Class attendance analysis
    const classAttendance =
      bookings.filter(b => b.status === 'checked_in').length / Math.max(bookings.length, 1);

    // Engagement patterns
    const weekendVisits = visits.filter(v => {
      const day = new Date(v.checkIn).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    }).length;

    const weekendEngagement = weekendVisits / Math.max(visits.length, 1);

    // Time-based patterns
    const morningVisits = visits.filter(v => {
      const hour = new Date(v.checkIn).getHours();
      return hour >= 6 && hour < 12;
    }).length;

    const eveningVisits = visits.filter(v => {
      const hour = new Date(v.checkIn).getHours();
      return hour >= 18 && hour < 22;
    }).length;

    const preferredTimeSlot = morningVisits > eveningVisits ? 'morning' : 'evening';

    return {
      visitFrequency,
      lastVisitDays,
      membershipDuration,
      classAttendance,
      paymentHistory: 1, // Would calculate from payment records
      visitTrend,
      weekendEngagement,
      preferredTimeSlot,
      recentVisits,
      totalVisits: visits.length,
    };
  }

  private calculateChurnProbability(features: any): number {
    // Enhanced rule-based churn prediction with multiple factors
    // In production, this would use a trained ML model (Random Forest, XGBoost, etc.)

    let score = 0;
    const weights = {
      visitFrequency: 0.25,
      recency: 0.25,
      trend: 0.2,
      engagement: 0.15,
      tenure: 0.1,
      consistency: 0.05,
    };

    // Visit frequency factor (0-1 scale)
    let frequencyScore = 0;
    if (features.visitFrequency < 0.5) frequencyScore = 1.0;
    else if (features.visitFrequency < 1) frequencyScore = 0.8;
    else if (features.visitFrequency < 2) frequencyScore = 0.5;
    else if (features.visitFrequency < 3) frequencyScore = 0.2;
    else frequencyScore = 0.0;

    score += frequencyScore * weights.visitFrequency;

    // Recency factor (last visit)
    let recencyScore = 0;
    if (features.lastVisitDays > 21) recencyScore = 1.0;
    else if (features.lastVisitDays > 14) recencyScore = 0.8;
    else if (features.lastVisitDays > 7) recencyScore = 0.5;
    else if (features.lastVisitDays > 3) recencyScore = 0.2;
    else recencyScore = 0.0;

    score += recencyScore * weights.recency;

    // Visit trend factor (declining engagement)
    let trendScore = 0;
    if (features.visitTrend < -0.5)
      trendScore = 1.0; // Significant decline
    else if (features.visitTrend < -0.2)
      trendScore = 0.7; // Moderate decline
    else if (features.visitTrend < 0)
      trendScore = 0.4; // Slight decline
    else trendScore = 0.0; // Stable or improving

    score += trendScore * weights.trend;

    // Engagement factor (class attendance, weekend usage)
    let engagementScore = 0;
    if (features.classAttendance < 0.2) engagementScore += 0.5;
    else if (features.classAttendance < 0.5) engagementScore += 0.2;

    if (features.weekendEngagement < 0.1) engagementScore += 0.3;
    else if (features.weekendEngagement < 0.2) engagementScore += 0.1;

    score += Math.min(1.0, engagementScore) * weights.engagement;

    // Tenure factor (new members are higher risk)
    let tenureScore = 0;
    if (features.membershipDuration < 14)
      tenureScore = 0.8; // Very new
    else if (features.membershipDuration < 30)
      tenureScore = 0.6; // New
    else if (features.membershipDuration < 90)
      tenureScore = 0.3; // Settling in
    else if (features.membershipDuration > 365) tenureScore = -0.2; // Loyal (reduces risk)

    score += tenureScore * weights.tenure;

    // Consistency factor (regular vs sporadic usage)
    let consistencyScore = 0;
    const avgVisitsPerWeek = features.visitFrequency;
    const totalWeeks = Math.max(features.membershipDuration / 7, 1);
    const expectedVisits = avgVisitsPerWeek * totalWeeks;
    const actualVisits = features.totalVisits;

    if (actualVisits < expectedVisits * 0.5)
      consistencyScore = 0.8; // Very inconsistent
    else if (actualVisits < expectedVisits * 0.7) consistencyScore = 0.4; // Somewhat inconsistent

    score += consistencyScore * weights.consistency;

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(0.98, score));
  }

  private categorizeRisk(probability: number): 'low' | 'medium' | 'high' {
    if (probability > 0.7) return 'high';
    if (probability > 0.4) return 'medium';
    return 'low';
  }

  private identifyRiskFactors(features: any): string[] {
    const factors: string[] = [];

    // Visit frequency issues
    if (features.visitFrequency < 0.5) {
      factors.push('Frecuencia de visitas muy baja (menos de 0.5 por semana)');
    } else if (features.visitFrequency < 1) {
      factors.push('Baja frecuencia de visitas (menos de 1 por semana)');
    }

    // Recency issues
    if (features.lastVisitDays > 21) {
      factors.push('No ha visitado en más de 3 semanas');
    } else if (features.lastVisitDays > 14) {
      factors.push('No ha visitado en más de 2 semanas');
    } else if (features.lastVisitDays > 7) {
      factors.push('No ha visitado en la última semana');
    }

    // Declining engagement
    if (features.visitTrend < -0.5) {
      factors.push('Fuerte disminución en actividad reciente');
    } else if (features.visitTrend < -0.2) {
      factors.push('Disminución moderada en actividad');
    }

    // Low engagement
    if (features.classAttendance < 0.2) {
      factors.push('Muy baja participación en clases grupales');
    } else if (features.classAttendance < 0.5) {
      factors.push('Baja participación en clases grupales');
    }

    // Weekend engagement
    if (features.weekendEngagement < 0.1) {
      factors.push('No utiliza el gimnasio los fines de semana');
    }

    // New member risk
    if (features.membershipDuration < 14) {
      factors.push('Miembro muy nuevo (primeras 2 semanas críticas)');
    } else if (features.membershipDuration < 30) {
      factors.push('Miembro nuevo (primer mes crítico)');
    }

    // Inconsistent usage
    const avgVisitsPerWeek = features.visitFrequency;
    const totalWeeks = Math.max(features.membershipDuration / 7, 1);
    const expectedVisits = avgVisitsPerWeek * totalWeeks;
    const actualVisits = features.totalVisits;

    if (actualVisits < expectedVisits * 0.5) {
      factors.push('Patrón de uso muy inconsistente');
    }

    // Recent activity concerns
    if (features.recentVisits === 0) {
      factors.push('Sin visitas en el último mes');
    } else if (features.recentVisits < 2) {
      factors.push('Muy pocas visitas en el último mes');
    }

    return factors;
  }

  private generateChurnRecommendations(risk: string, factors: string[]): string[] {
    const recommendations: string[] = [];

    if (risk === 'high') {
      recommendations.push('Contactar inmediatamente para ofrecer sesión personalizada');
      recommendations.push('Ofrecer descuento o promoción especial');
      recommendations.push('Programar llamada de seguimiento con entrenador');
    } else if (risk === 'medium') {
      recommendations.push('Enviar recordatorio amigable sobre beneficios del gimnasio');
      recommendations.push('Invitar a clase grupal o evento especial');
      recommendations.push('Ofrecer consulta nutricional gratuita');
    } else {
      recommendations.push('Mantener engagement con contenido motivacional');
      recommendations.push('Invitar a referir amigos con incentivo');
    }

    return recommendations;
  }

  private predictNextAction(features: any, risk: string): string {
    if (risk === 'high') {
      return features.lastVisitDays > 14
        ? 'Probable cancelación en 7 días'
        : 'Visita irregular esperada';
    } else if (risk === 'medium') {
      return 'Monitorear patrones de visita';
    } else {
      return 'Continuar rutina normal';
    }
  }
}

// Export service instances
export const bodyScanService = new BodyScanService();
export const churnPredictionService = new ChurnPredictionService();
