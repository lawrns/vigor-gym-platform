import { Router } from 'express';

export function registerReferrals(r: Router) {
  r.get('/v1/referrals', (_req, res) => res.status(501).json({ status: 'not_implemented' }));
  r.post('/v1/referrals', (_req, res) => res.status(501).json({ status: 'not_implemented' }));
  r.post('/v1/referrals/:code/redeem', (_req, res) => res.status(501).json({ status: 'not_implemented' }));
}
