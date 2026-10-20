const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

let server;
let baseUrl;

before(async () => {
  await prisma.$connect();
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

describe('Phase 1 - Multi-Tenant Authentication & Authorization Tests', () => {
  let ownerToken = '';
  let employeeToken = '';
  let tenantId = '';

  test('1. Owner login succeeds and returns tenant context & permissions', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digitalcrowdtech.in',
        password: 'Password@123',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken);
    assert.equal(body.data.role, 'OWNER');
    assert.ok(body.data.tenant.id);

    ownerToken = body.data.accessToken;
    tenantId = body.data.tenant.id;
  });

  test('2. Login fails with invalid password', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digitalcrowdtech.in',
        password: 'WrongPassword!',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
  });

  test('3. Employee login succeeds with EMPLOYEE role', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'employee@digitalcrowdtech.in',
        password: 'Password@123',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.role, 'EMPLOYEE');
    assert.ok(body.data.accessToken);

    employeeToken = body.data.accessToken;
  });

  test('4. Dashboard summary loads successfully for authorized tenant', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.overview);
    assert.ok(typeof body.data.overview.totalTasks === 'number');
    assert.ok(Array.isArray(body.data.branchWorkload));
  });

  test('5. Cross-tenant access is blocked with 403 Forbidden', async () => {
    const fakeTenantId = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': fakeTenantId,
      },
    });

    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.success, false);
  });

  test('6. Register a brand new company onboarding flow', async () => {
    const rand = Math.floor(Math.random() * 100000);
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: `Acme Retail Solutions ${rand}`,
        fullName: 'Rajesh Sharma',
        email: `rajesh_${rand}@acmeretail.com`,
        password: 'SuperSecretPassword@123',
        phone: '+91 9998887776',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken);
    assert.equal(body.data.role, 'OWNER');
    assert.ok(body.data.tenant.slug.includes('acme-retail-solutions'));
  });
});
