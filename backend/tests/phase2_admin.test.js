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

describe('Phase 2 — Core Security, Administration & RBAC Tests', () => {
  let ownerToken = '';
  let employeeToken = '';
  let tenantId = '';
  let employeeRoleId = '';
  let hqBranchId = '';

  before(async () => {
    // Login as Owner
    const ownerRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digitalcrowdtech.in',
        password: 'Password@123',
      }),
    });
    const ownerData = await ownerRes.json();
    ownerToken = ownerData.data.accessToken;
    tenantId = ownerData.data.tenant.id;

    // Login as Employee
    const empRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'employee@digitalcrowdtech.in',
        password: 'Password@123',
      }),
    });
    const empData = await empRes.json();
    employeeToken = empData.data.accessToken;

    // Get employee role id
    const role = await prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });
    employeeRoleId = role.id;

    // Get HQ branch id
    const branch = await prisma.branch.findFirst({ where: { tenantId } });
    hqBranchId = branch.id;
  });

  test('1. Session Management: User can list active sessions and revoke a session', async () => {
    const listRes = await fetch(`${baseUrl}/api/v1/auth/sessions`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const listData = await listRes.json();
    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listData.data));
    assert.ok(listData.data.length > 0);

    const targetSessionId = listData.data[0].id;
    const revokeRes = await fetch(`${baseUrl}/api/v1/auth/sessions/${targetSessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const revokeData = await revokeRes.json();
    assert.equal(revokeRes.status, 200);
    assert.equal(revokeData.success, true);
  });

  test('2. Tenant Usage & Settings: Retrieve usage counters and update profile', async () => {
    const usageRes = await fetch(`${baseUrl}/api/v1/tenants/usage`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const usageData = await usageRes.json();
    assert.equal(usageRes.status, 200);
    assert.ok(usageData.data.users.max > 0);
    assert.ok(typeof usageData.data.users.current === 'number');

    // Update tenant profile
    const updateRes = await fetch(`${baseUrl}/api/v1/tenants/current`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timezone: 'Asia/Kolkata',
      }),
    });
    assert.equal(updateRes.status, 200);
  });

  test('3. RBAC: Employee is blocked from updating role permissions with 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/roles/${employeeRoleId}/permissions`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        permissionSlugs: ['settings.manage', 'billing.manage'],
      }),
    });
    assert.equal(res.status, 403);
  });

  test('4. Full Employee Invitation & Onboarding Lifecycle', async () => {
    const rand = Math.floor(Math.random() * 100000);
    const newStaffEmail = `staff_${rand}@digitalcrowdtech.in`;

    // A. Owner creates invitation
    const inviteRes = await fetch(`${baseUrl}/api/v1/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: newStaffEmail,
        roleId: employeeRoleId,
        branchId: hqBranchId,
        designation: 'Inventory Associate',
      }),
    });
    const inviteData = await inviteRes.json();
    assert.equal(inviteRes.status, 201);
    assert.ok(inviteData.data.token);

    const token = inviteData.data.token;

    // B. Public token verification check
    const verifyRes = await fetch(`${baseUrl}/api/v1/invitations/verify/${token}`);
    const verifyData = await verifyRes.json();
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyData.data.email, newStaffEmail);

    // C. Accept invitation and onboard
    const acceptRes = await fetch(`${baseUrl}/api/v1/invitations/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        fullName: 'New Staff Member',
        password: 'Password@Staff123',
        phone: '+91 9112233445',
      }),
    });
    const acceptData = await acceptRes.json();
    assert.equal(acceptRes.status, 200);
    assert.ok(acceptData.data.accessToken);

    // D. Re-using the same token fails with 400
    const reuseRes = await fetch(`${baseUrl}/api/v1/invitations/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        fullName: 'Imposter',
        password: 'Password@Staff123',
      }),
    });
    assert.equal(reuseRes.status, 400);
  });

  test('5. Teams Management: Create team, assign member, remove member', async () => {
    const rand = Math.floor(Math.random() * 10000);
    // Create team
    const teamRes = await fetch(`${baseUrl}/api/v1/teams`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Field Auditing Unit ${rand}`,
        branchId: hqBranchId,
        description: 'Periodic audits and compliance inspections',
      }),
    });
    const teamData = await teamRes.json();
    assert.equal(teamRes.status, 201);
    const teamId = teamData.data.id;

    // Get an active member to assign
    const member = await prisma.tenantMember.findFirst({
      where: { tenantId, user: { email: 'employee@digitalcrowdtech.in' } },
    });

    // Assign member to team
    const assignRes = await fetch(`${baseUrl}/api/v1/teams/${teamId}/members`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberId: member.id,
        isLeader: true,
      }),
    });
    assert.equal(assignRes.status, 200);

    // Verify team members
    const getTeamRes = await fetch(`${baseUrl}/api/v1/teams/${teamId}`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const getTeamData = await getTeamRes.json();
    assert.equal(getTeamRes.status, 200);
    assert.equal(getTeamData.data.members.length, 1);
    assert.equal(getTeamData.data.members[0].isLeader, true);
  });
});
