import { Router } from 'express';

export function registerJourneys(r: Router) {
  r.get('/v1/journeys', (_req, res) => res.status(501).json({ status: 'not_implemented' }));
  r.post('/v1/journeys', (_req, res) => res.status(501).json({ status: 'not_implemented' }));
}
