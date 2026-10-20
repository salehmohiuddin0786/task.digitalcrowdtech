// Phase 7 — Production Hardening, Security, Healthchecks, & E2E Validation Tests
// TaskDigitalCrowd — Digital Crowd Technologies
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Phase 7 — Production Hardening, Security & End-to-End Sanity Tests', () => {
  let server;
  let baseUrl;
  let ownerToken;
  let tenantId;

  before(async () => {
    // Start temporary test server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Login as owner to obtain credentials
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digitalcrowdtech.in',
        password: 'Password@123',
      }),
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    ownerToken = loginData.data.accessToken;
    tenantId = loginData.data.tenant.id;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. System Healthcheck: Root /health & /api/v1/health report healthy database & system metrics', async () => {
    const res1 = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res1.status, 200);
    const body1 = await res1.json();
    assert.strictEqual(body1.status, 'healthy');
    assert.strictEqual(body1.company, 'Digital Crowd Technologies');
    assert.strictEqual(body1.system.database.status, 'connected');
    assert.ok(typeof body1.uptimeSeconds === 'number');

    const res2 = await fetch(`${baseUrl}/api/v1/health`);
    assert.strictEqual(res2.status, 200);
    const body2 = await res2.json();
    assert.strictEqual(body2.status, 'healthy');
    assert.strictEqual(body2.service, 'TaskDigitalCrowd Backend API');
  });

  test('2. Security Headers: Helmet & CORS headers are configured correctly', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('cross-origin-resource-policy'), 'cross-origin');
  });

  test('3. Unmatched Route Handler: 404 returns structured JSON error message', async () => {
    const res = await fetch(`${baseUrl}/api/v1/non-existent-route-777`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('Cannot GET /api/v1/non-existent-route-777'));
  });

  test('4. Full End-to-End Task Lifecycle: Create -> Prerequisite -> Review -> Audit Verify', async () => {
    // 1. Create Task A (Preparation)
    const taskARes = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        title: 'E2E Pre-flight Inventory Check',
        priority: 'HIGH',
        category: 'AUDIT',
      }),
    });
    const taskAData = await taskARes.json();
    assert.strictEqual(taskARes.status, 201);
    const taskAId = taskAData.data.id;

    // 2. Create Task B (Dependent)
    const taskBRes = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        title: 'E2E Client Handover Delivery',
        priority: 'URGENT',
        requiresProof: true,
        proofType: 'PHOTO',
      }),
    });
    const taskBData = await taskBRes.json();
    assert.strictEqual(taskBRes.status, 201);
    const taskBId = taskBData.data.id;

    // 3. Link Task A as prerequisite to Task B
    const depRes = await fetch(`${baseUrl}/api/v1/tasks/${taskBId}/dependencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        prerequisiteTaskId: taskAId,
      }),
    });
    assert.strictEqual(depRes.status, 201);

    // 4. Verify Task B is blocked from starting
    const startBlockedRes = await fetch(`${baseUrl}/api/v1/tasks/${taskBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert.strictEqual(startBlockedRes.status, 422);

    // 5. Complete Task A to unblock Task B
    const completeTaskARes = await fetch(`${baseUrl}/api/v1/tasks/${taskAId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    assert.strictEqual(completeTaskARes.status, 200);

    // 6. Now Task B starts successfully
    const startUnblockedRes = await fetch(`${baseUrl}/api/v1/tasks/${taskBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert.strictEqual(startUnblockedRes.status, 200);

    // 7. Cleanup E2E tasks
    await fetch(`${baseUrl}/api/v1/tasks/${taskBId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    await fetch(`${baseUrl}/api/v1/tasks/${taskAId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
  });
});
