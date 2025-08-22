import { CFDIInvoiceForm } from '../../../../components/CFDIInvoiceForm';

export const dynamic = 'force-dynamic';

export default function InvoicesPage() {
  return (
    <main className="max-w-3xl mx-auto py-8 space-y-4">
      <h1 className="text-2xl font-display">Facturas</h1>
      <CFDIInvoiceForm />
    </main>
  );
}

