"use client";

import { Icons } from '../../lib/icons/registry';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/card';

interface BodyScanResult {
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

interface BodyScanResultsProps {
  result: BodyScanResult;
  memberName: string;
  onClose: () => void;
  onSaveToProfile?: () => void;
}

export function BodyScanResults({ result, memberName, onClose, onSaveToProfile }: BodyScanResultsProps) {
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Bajo peso', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Sobrepeso', color: 'text-yellow-600' };
    return { category: 'Obesidad', color: 'text-red-600' };
  };

  const getBodyFatCategory = (bodyFat: number, gender: 'male' | 'female' = 'male') => {
    const ranges = gender === 'male' 
      ? { low: 10, normal: 18, high: 25 }
      : { low: 16, normal: 25, high: 32 };
    
    if (bodyFat < ranges.low) return { category: 'Bajo', color: 'text-blue-600' };
    if (bodyFat < ranges.normal) return { category: 'Normal', color: 'text-green-600' };
    if (bodyFat < ranges.high) return { category: 'Alto', color: 'text-yellow-600' };
    return { category: 'Muy alto', color: 'text-red-600' };
  };

  const getPoseQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <Icons.CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good': return <Icons.Check className="h-5 w-5 text-blue-600" />;
      case 'fair': return <Icons.AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'poor': return <Icons.X className="h-5 w-5 text-red-600" />;
      default: return <Icons.AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const bmiInfo = getBMICategory(result.bmi);
  const bodyFatInfo = getBodyFatCategory(result.bodyFatPercentage);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resultados del Escaneo Corporal
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {memberName} • {new Date().toLocaleDateString('es-MX')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getPoseQualityIcon(result.poseQuality)}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Calidad: {result.poseQuality}
          </span>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BMI Card */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Índice de Masa Corporal
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {result.bmi}
              </div>
              <div className={`text-sm font-medium ${bmiInfo.color}`}>
                {bmiInfo.category}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Body Fat Card */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Grasa Corporal
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {result.bodyFatPercentage}%
              </div>
              <div className={`text-sm font-medium ${bodyFatInfo.color}`}>
                {bodyFatInfo.category}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Muscle Mass Card */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Masa Muscular
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {result.muscleMass} kg
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Estimado
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Measurements */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Medidas Corporales (cm)
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(result.measurements).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {key === 'chest' ? 'Pecho' :
                   key === 'waist' ? 'Cintura' :
                   key === 'hips' ? 'Cadera' :
                   key === 'arms' ? 'Brazos' :
                   key === 'thighs' ? 'Muslos' : key}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recomendaciones Personalizadas
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Icons.CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-900 dark:text-blue-100 text-sm">
                  {recommendation}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confidence and Technical Info */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Información Técnica
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Confianza del Análisis
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                ID del Escaneo
              </div>
              <div className="text-sm font-mono text-gray-900 dark:text-white">
                {result.scanId}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button onClick={onClose} variant="outline">
          Cerrar
        </Button>
        {onSaveToProfile && (
          <Button onClick={onSaveToProfile} className="flex items-center gap-2">
            <Icons.Upload className="h-4 w-4" />
            Guardar en Perfil
          </Button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Icons.AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Aviso Importante</p>
            <p>
              Los resultados son estimaciones basadas en análisis de imagen y datos antropométricos. 
              Para mediciones precisas, consulta con un profesional de la salud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
