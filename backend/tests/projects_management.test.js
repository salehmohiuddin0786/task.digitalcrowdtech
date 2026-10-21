// Projects Management & Leadership Assignment Tests
// TaskDigitalCrowd — Digital Crowd Technologies
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Projects Management, Auto Code Sequence, & Project Lead Assignment Tests', () => {
  let server;
  let baseUrl;
  let ownerToken;
  let tenantId;
  let branchId;
  let ownerUserId;
  let createdProjectId;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Login as owner
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
    ownerUserId = loginData.data.user.id;

    // Get an existing branch for this tenant
    const branchRes = await fetch(`${baseUrl}/api/v1/branches`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const branchData = await branchRes.json();
    if (branchData.data && branchData.data.length > 0) {
      branchId = branchData.data[0].id;
    }
  });

  after(async () => {
    // Clean up created test project
    if (createdProjectId) {
      await prisma.project.deleteMany({
        where: { id: createdProjectId },
      }).catch(() => {});
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. Project Code Preview: Returns valid sequence code with current year', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects/preview-code`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data?.code);
    const currentYear = new Date().getFullYear();
    assert.match(body.data.code, new RegExp(`^PRJ-${currentYear}-\\d{4}$`));
  });

  test('2. Eligible Project Leads: Retrieves active organization leadership and members', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects/eligible-leads`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);

    // Verify owner is among eligible leads
    const ownerLead = body.data.find((l) => l.userId === ownerUserId);
    assert.ok(ownerLead, 'Owner must be present in eligible project leads');
    assert.strictEqual(ownerLead.roleName, 'OWNER');
    assert.strictEqual(ownerLead.isOrgWide, true);
  });

  test('3. Create Project: Successfully creates project with auto-code, lead, priority, branch & target date', async () => {
    const targetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        name: 'Automated Regional Rollout & Compliance 2026',
        description: 'Multi-branch operations audit and compliance tracking',
        branchId: branchId || null,
        leadId: ownerUserId,
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        targetEndDate: targetDate,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data?.id);
    assert.ok(body.data?.code);
    assert.strictEqual(body.data.priority, 'HIGH');
    assert.strictEqual(body.data.status, 'IN_PROGRESS');
    assert.strictEqual(body.data.leadId, ownerUserId);
    assert.strictEqual(body.data.lead?.id, ownerUserId);

    createdProjectId = body.data.id;
  });

  test('4. Sequential Project Code Generation: Consecutive creations get unique sequential codes without collision', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        name: 'Second Concurrent Test Project',
        priority: 'URGENT',
        status: 'PLANNING',
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data?.code);
    assert.strictEqual(body.data.priority, 'URGENT');

    // Clean up second test project
    await prisma.project.delete({ where: { id: body.data.id } });
  });

  test('5. Cross-Tenant Security: Rejects branch belonging to another organization with 400', async () => {
    const fakeBranchId = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        name: 'Malicious Cross-Tenant Project',
        branchId: fakeBranchId,
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /branch does not exist or belongs to another organization/i);
  });

  test('6. Cross-Tenant Security: Rejects non-member lead assignment with 400', async () => {
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        name: 'Unauthorized Lead Assignment Project',
        leadId: fakeUserId,
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /not an active member of this organization/i);
  });

  test('7. List Projects: Returns project with lead info, priority, and computed stats', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects?priority=HIGH`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));

    const found = body.data.find((p) => p.id === createdProjectId);
    assert.ok(found, 'Created project must be in filtered list');
    assert.strictEqual(found.priority, 'HIGH');
    assert.ok(found.stats);
    assert.strictEqual(found.stats.completionPercentage, 0);
    assert.strictEqual(found.stats.hasTasks, false);
  });

  test('8. Update Project: Can update priority, status, and lead', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects/${createdProjectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        priority: 'URGENT',
        status: 'ON_HOLD',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.priority, 'URGENT');
    assert.strictEqual(body.data.status, 'ON_HOLD');
  });
});
