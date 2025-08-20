/**
 * Integration tests for events API
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { generateToken } from '../../src/lib/auth/jwt';

describe('Events API', () => {
  const validOrgId = '489ff883-138b-44a1-88db-83927b596e35';
  const invalidOrgId = 'invalid-uuid';
  const mismatchOrgId = '12345678-1234-1234-1234-123456789012';

  let authToken: string;

  beforeAll(() => {
    // Generate test token
    authToken = generateToken({
      userId: '7519a35e-21f8-48ca-bc26-7ec90f216274',
      email: 'admin@testgym.mx',
      role: 'owner',
      companyId: validOrgId,
    });
  });

  it('returns 422 on missing orgId', async () => {
    const response = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(422);

    expect(response.body).toMatchObject({
      error: 'INVALID_ORG_ID',
      field: 'orgId',
      hint: 'Pass ?orgId identical to user.company.id',
    });
  });

  it('returns 422 on invalid orgId format', async () => {
    const response = await request(app)
      .get('/api/events')
      .query({ orgId: invalidOrgId })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(422);

    expect(response.body).toMatchObject({
      error: 'INVALID_ORG_ID',
      field: 'orgId',
    });
  });

  it('returns 403 on orgId mismatch', async () => {
    const response = await request(app)
      .get('/api/events')
      .query({ orgId: mismatchOrgId })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(403);

    expect(response.body).toMatchObject({
      error: 'FORBIDDEN',
      message: 'Access denied to organization data',
    });
  });

  it('returns 200 on valid orgId', async () => {
    const response = await request(app)
      .get('/api/events')
      .query({ orgId: validOrgId })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
  });

  it('accepts optional locationId', async () => {
    const locationId = '45800ff7-948d-48bd-a9fc-25ab5c866860';

    const response = await request(app)
      .get('/api/events')
      .query({
        orgId: validOrgId,
        locationId: locationId,
      })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
  });
});
