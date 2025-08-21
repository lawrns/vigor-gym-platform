"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/lib/icons/registry';

if (process.env.NEXT_PUBLIC_REFERRALS !== '1') {
  throw new Error('Referrals disabled');
}

interface ReferralCode {
  id: string;
  code: string;
  discount: number;
  usageCount: number;
  maxUses: number;
  expiresAt: string;
  createdAt: string;
}

export default function ReferralsPage() {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([
    {
      id: '1',
      code: 'AMIGO20',
      discount: 20,
      usageCount: 5,
      maxUses: 50,
      expiresAt: '2025-12-31',
      createdAt: '2025-08-01'
    },
    {
      id: '2',
      code: 'FAMILIA15',
      discount: 15,
      usageCount: 12,
      maxUses: 100,
      expiresAt: '2025-11-30',
      createdAt: '2025-07-15'
    }
  ]);

  const [newCodeDiscount, setNewCodeDiscount] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('');

  const generateReferralCode = () => {
    const code = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode: ReferralCode = {
      id: Date.now().toString(),
      code,
      discount: parseInt(newCodeDiscount) || 10,
      usageCount: 0,
      maxUses: parseInt(newCodeMaxUses) || 25,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setReferralCodes([newCode, ...referralCodes]);
    setNewCodeDiscount('');
    setNewCodeMaxUses('');
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // TODO: Add toast notification
  };

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Sistema de Referidos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Genera códigos de descuento para que tus miembros refieran nuevos clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create New Referral Code */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Crear Código</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descuento (%)
                </label>
                <Input
                  type="number"
                  placeholder="10"
                  value={newCodeDiscount}
                  onChange={(e) => setNewCodeDiscount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usos máximos
                </label>
                <Input
                  type="number"
                  placeholder="25"
                  value={newCodeMaxUses}
                  onChange={(e) => setNewCodeMaxUses(e.target.value)}
                />
              </div>

              <Button onClick={generateReferralCode} className="w-full">
                <Icons.Plus className="h-4 w-4 mr-2" />
                Generar Código
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estadísticas</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Códigos activos</span>
                  <span className="font-semibold">{referralCodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total usos</span>
                  <span className="font-semibold">{referralCodes.reduce((sum, code) => sum + code.usageCount, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nuevos miembros</span>
                  <span className="font-semibold text-green-600">+{referralCodes.reduce((sum, code) => sum + code.usageCount, 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Codes List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Códigos de Referido</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referralCodes.map((code) => (
                  <div key={code.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                            {code.code}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {code.discount}% descuento
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Expira: {new Date(code.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {code.usageCount}/{code.maxUses} usos
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {Math.round((code.usageCount / code.maxUses) * 100)}% utilizado
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Icons.Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded p-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(code.usageCount / code.maxUses) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
