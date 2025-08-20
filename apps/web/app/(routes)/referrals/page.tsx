"use client";

if (process.env.NEXT_PUBLIC_REFERRALS !== '1') {
  throw new Error('Referrals disabled');
}

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Referidos</h1>
      <p className="text-sm text-muted-foreground">Genera códigos, comparte y canjea.</p>
    </div>
  );
}
