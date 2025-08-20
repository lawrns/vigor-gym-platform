import { Router } from 'express';

export function registerCampaigns(r: Router) {
  r.get('/v1/campaigns', (_req, res) => res.status(501).json({ status: 'not_implemented' }));
  r.post('/v1/campaigns', (_req, res) => res.status(501).json({ status: 'not_implemented' }));
}
