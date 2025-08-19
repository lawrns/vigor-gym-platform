'use client';
import React, { useState } from 'react';

const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;

export function CFDIInvoiceForm({
  onSubmit,
}: {
  onSubmit?: (payload: { rfc: string; usoCFDI: string; regimenFiscal: string }) => void;
}) {
  const [rfc, setRfc] = useState('');
  const [usoCFDI, setUsoCFDI] = useState('G03');
  const [regimenFiscal, setRegimenFiscal] = useState('601');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!RFC_REGEX.test(rfc.toUpperCase())) {
      setError('RFC inválido');
      return;
    }
    setError(null);
    onSubmit?.({ rfc: rfc.toUpperCase(), usoCFDI, regimenFiscal });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-50 p-4 rounded-md space-y-3">
      <div>
        <label className="block text-sm text-neutral-700">RFC</label>
        <input
          value={rfc}
          onChange={e => setRfc(e.target.value)}
          className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-neutral-700">Uso CFDI</label>
        <select
          value={usoCFDI}
          onChange={e => setUsoCFDI(e.target.value)}
          className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2"
        >
          <option value="G03">G03 - Gastos en general</option>
          <option value="P01">P01 - Por definir</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-neutral-700">Régimen Fiscal</label>
        <select
          value={regimenFiscal}
          onChange={e => setRegimenFiscal(e.target.value)}
          className="mt-1 w-full border border-neutral-200 rounded-md px-3 py-2"
        >
          <option value="601">601 - General de Ley Personas Morales</option>
          <option value="605">605 - Sueldos y Salarios</option>
        </select>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button type="submit" className="px-3 py-2 rounded-md bg-primary-500 text-white">
        Guardar
      </button>
    </form>
  );
}
