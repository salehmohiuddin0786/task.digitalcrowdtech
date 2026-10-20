// Role-Based Authorization, Negative Security & Dashboard Scoping Tests
// TaskDigitalCrowd — Digital Crowd Technologies
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Role-Based Authorization & Dashboard Scoping Tests (All 6 Roles)', () => {
  let server;
  let baseUrl;
  let tokens = {};
  let tenantId;
  let hqBranchId;
  let otherBranchId;
  let testTaskId;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Get tenant and branch IDs
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'digital-crowd-technologies' },
    });
    tenantId = tenant.id;

    const hq = await prisma.branch.findFirst({
      where: { tenantId, code: 'HQ-HYD' },
    });
    hqBranchId = hq.id;

    // Create a secondary branch for testing cross-branch isolation
    let otherBranch = await prisma.branch.findFirst({
      where: { tenantId, code: 'SEC-BLR' },
    });
    if (!otherBranch) {
      otherBranch = await prisma.branch.create({
        data: {
          tenantId,
          name: 'Bengaluru Tech Branch',
          code: 'SEC-BLR',
          city: 'Bengaluru',
          state: 'Karnataka',
        },
      });
    }
    otherBranchId = otherBranch.id;

    // Authenticate all 6 roles
    const accounts = [
      { role: 'SUPER_ADMIN', email: 'superadmin@digitalcrowdtech.in', password: 'Password@123' },
      { role: 'OWNER', email: 'admin@digitalcrowdtech.in', password: 'Password@123' },
      { role: 'BRANCH_MANAGER', email: 'manager@digitalcrowdtech.in', password: 'Password@123' },
      { role: 'TEAM_LEADER', email: 'lead@digitalcrowdtech.in', password: 'Password@123' },
      { role: 'EMPLOYEE', email: 'employee@digitalcrowdtech.in', password: 'Password@123' },
      { role: 'VIEWER', email: 'viewer@digitalcrowdtech.in', password: 'Password@123' },
    ];

    for (const acc of accounts) {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200, `Login failed for ${acc.role}`);
      tokens[acc.role] = data.data.accessToken;
    }
  });

  after(async () => {
    // Cleanup any created task
    if (testTaskId) {
      await prisma.task.deleteMany({ where: { id: testTaskId } });
    }
    await new Promise((resolve) => server.close(resolve));
  });

  test('1. SUPER_ADMIN: Receives platform diagnostics, health, and multi-tenant metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${tokens.SUPER_ADMIN}`,
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.role, 'SUPER_ADMIN');
    assert.ok(typeof body.data.platformMetrics.totalTenants === 'number');
    assert.ok(Array.isArray(body.data.recentTenants));
  });

  test('2. OWNER: Receives organization-wide task metrics, branch breakdown, and can create tasks', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${tokens.OWNER}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.role, 'OWNER');
    assert.ok(Array.isArray(body.data.branchWorkload));

    // Owner creates a task in HQ branch
    const createRes = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.OWNER}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        title: 'Authorization Test Task - HQ Operations',
        branchId: hqBranchId,
        priority: 'HIGH',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    testTaskId = createData.data.id;
  });

  test('3. BRANCH_MANAGER: Scoped strictly to assigned branch; blocked from viewing or creating for other branches', async () => {
    // Branch manager views dashboard: scoped to HQ branch
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${tokens.BRANCH_MANAGER}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.role, 'BRANCH_MANAGER');

    // Negative Authorization: Branch Manager attempts to query other branch's tasks
    const crossBranchRes = await fetch(`${baseUrl}/api/v1/tasks?branchId=${otherBranchId}`, {
      headers: {
        Authorization: `Bearer ${tokens.BRANCH_MANAGER}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.strictEqual(crossBranchRes.status, 403);

    // Negative Authorization: Branch Manager attempts to create a task in another branch
    const crossCreateRes = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.BRANCH_MANAGER}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        title: 'Unauthorized Cross-Branch Task',
        branchId: otherBranchId,
      }),
    });
    assert.strictEqual(crossCreateRes.status, 403);
  });

  test('4. TEAM_LEADER: Scoped strictly to authorized teams; blocked from unrelated teams', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${tokens.TEAM_LEADER}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.role, 'TEAM_LEADER');

    // Negative Authorization: Team Leader attempts to query a non-existent/unauthorized team
    const fakeTeamId = '00000000-0000-0000-0000-000000000000';
    const crossTeamRes = await fetch(`${baseUrl}/api/v1/tasks?teamId=${fakeTeamId}`, {
      headers: {
        Authorization: `Bearer ${tokens.TEAM_LEADER}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.strictEqual(crossTeamRes.status, 403);
  });

  test('5. EMPLOYEE: Scoped to assigned tasks; cannot self-approve or mark tasks COMPLETED', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${tokens.EMPLOYEE}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.role, 'EMPLOYEE');

    // Negative Authorization: Employee attempts to complete an unassigned task
    const completeRes = await fetch(`${baseUrl}/api/v1/tasks/${testTaskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.EMPLOYEE}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    assert.strictEqual(completeRes.status, 403);

    // Negative Authorization: Employee attempts to submit review approval
    const reviewRes = await fetch(`${baseUrl}/api/v1/tasks/${testTaskId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.EMPLOYEE}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ decision: 'APPROVED' }),
    });
    assert.strictEqual(reviewRes.status, 403);
  });

  test('6. VIEWER: Read-only access; blocked from creating, editing, and exporting reports', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${tokens.VIEWER}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.role, 'VIEWER');
    assert.strictEqual(body.data.isReadOnly, true);

    // Negative Authorization: Viewer attempts to create a task
    const createRes = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.VIEWER}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ title: 'Illegal Viewer Task' }),
    });
    assert.strictEqual(createRes.status, 403);

    // Negative Authorization: Viewer attempts to update task status
    const statusRes = await fetch(`${baseUrl}/api/v1/tasks/${testTaskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.VIEWER}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert.strictEqual(statusRes.status, 403);

    // Negative Authorization: Viewer attempts to post a comment
    const commentRes = await fetch(`${baseUrl}/api/v1/tasks/${testTaskId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.VIEWER}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ content: 'Illegal viewer comment' }),
    });
    assert.strictEqual(commentRes.status, 403);

    // Negative Authorization: Viewer attempts to add checklist item
    const checklistRes = await fetch(`${baseUrl}/api/v1/tasks/${testTaskId}/checklists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.VIEWER}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ title: 'Illegal viewer checklist' }),
    });
    assert.strictEqual(checklistRes.status, 403);

    // Negative Authorization: Viewer attempts to upload evidence
    const evidenceRes = await fetch(`${baseUrl}/api/v1/tasks/${testTaskId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.VIEWER}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ fileName: 'illegal.jpg', fileType: 'PHOTO' }),
    });
    assert.strictEqual(evidenceRes.status, 403);

    // Negative Authorization: Viewer attempts to create recurrence rule
    const recurrenceRes = await fetch(`${baseUrl}/api/v1/tasks/recurrence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.VIEWER}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        frequency: 'DAILY',
        titleTemplate: 'Viewer daily recurring task',
      }),
    });
    assert.strictEqual(recurrenceRes.status, 403);

    // Negative Authorization: Viewer attempts to export CSV reports
    const exportRes = await fetch(`${baseUrl}/api/v1/reports/export`, {
      headers: {
        Authorization: `Bearer ${tokens.VIEWER}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.strictEqual(exportRes.status, 403);
  });

  test('7. Privilege Escalation Guard: Tenant Owner cannot elevate anyone to SUPER_ADMIN or modify platform admin role', async () => {
    // Attempt to invite a user with SUPER_ADMIN role as an Owner
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    assert.ok(superAdminRole);

    const inviteRes = await fetch(`${baseUrl}/api/v1/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.OWNER}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        email: 'attacker@evil.com',
        roleId: superAdminRole.id,
      }),
    });
    assert.strictEqual(inviteRes.status, 403);

    // Attempt to modify SUPER_ADMIN role permissions as an Owner
    const modifyRoleRes = await fetch(`${baseUrl}/api/v1/roles/${superAdminRole.id}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.OWNER}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        permissionSlugs: ['tasks.view'],
      }),
    });
    assert.strictEqual(modifyRoleRes.status, 403);
  });
});
