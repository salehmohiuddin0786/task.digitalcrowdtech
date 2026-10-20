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

describe('Phase 6 — Task Dependencies, Prerequisite Blocking & Reports Analytics', () => {
  let ownerToken = '';
  let employeeToken = '';
  let tenantId = '';
  let taskAId = '';
  let taskBId = '';

  before(async () => {
    // Authenticate Owner
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

    // Authenticate Employee
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

    // Create Task A (Prerequisite)
    const resA = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        title: 'Task A: Safety Valve Inspection',
        priority: 'HIGH',
      }),
    });
    const dataA = await resA.json();
    taskAId = dataA.data.id;

    // Create Task B (Blocked downstream)
    const resB = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        title: 'Task B: Boiler Ignition and Activation',
        priority: 'URGENT',
      }),
    });
    const dataB = await resB.json();
    taskBId = dataB.data.id;
  });

  test('1. Dependency Creation & Validation: Add prerequisite dependency, block circular and self-loops', async () => {
    // Self-dependency test
    const selfRes = await fetch(`${baseUrl}/api/v1/tasks/${taskBId}/dependencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ prerequisiteTaskId: taskBId }),
    });
    assert.equal(selfRes.status, 400);

    // Valid dependency: Task B depends on Task A
    const addRes = await fetch(`${baseUrl}/api/v1/tasks/${taskBId}/dependencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ prerequisiteTaskId: taskAId }),
    });
    const addData = await addRes.json();
    assert.equal(addRes.status, 201);
    assert.equal(addData.data.prerequisiteTaskId, taskAId);

    // Circular dependency check: Task A cannot depend on Task B
    const circRes = await fetch(`${baseUrl}/api/v1/tasks/${taskAId}/dependencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ prerequisiteTaskId: taskBId }),
    });
    assert.equal(circRes.status, 400);
  });

  test('2. Prerequisite Blocking: Task B cannot transition to IN_PROGRESS while Task A is incomplete', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks/${taskBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });

    const body = await res.json();
    assert.equal(res.status, 422);
    assert.ok(body.message.includes('Blocked by incomplete prerequisite task'));
  });

  test('3. Dependency Override: Manager overrides prerequisite with reason, unblocking Task B', async () => {
    // Employee cannot override (403)
    const forbiddenRes = await fetch(`${baseUrl}/api/v1/tasks/${taskBId}/dependencies/${taskAId}/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ overrideReason: 'Employee bypass attempt' }),
    });
    assert.equal(forbiddenRes.status, 403);

    // Manager overrides with justification
    const overrideRes = await fetch(`${baseUrl}/api/v1/tasks/${taskBId}/dependencies/${taskAId}/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        overrideReason: 'Safety valve verified manually via secondary pressure gauge by Lead Engineer.',
      }),
    });
    const overrideData = await overrideRes.json();
    assert.equal(overrideRes.status, 200);
    assert.equal(overrideData.data.isOverridden, true);

    // Now Task B can successfully proceed to IN_PROGRESS
    const unblockRes = await fetch(`${baseUrl}/api/v1/tasks/${taskBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert.equal(unblockRes.status, 200);
  });

  test('4. Overview Analytics: Retrieve comprehensive KPIs, breakdowns, and distributions', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/overview`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(body.data.kpis.totalTasks >= 2);
    assert.ok(typeof body.data.kpis.completionRate === 'number');
    assert.ok(body.data.statusDistribution !== undefined);
    assert.ok(body.data.priorityDistribution !== undefined);
    assert.ok(Array.isArray(body.data.branchBreakdown));
    assert.ok(Array.isArray(body.data.teamBreakdown));
  });

  test('5. Employee Leaderboard: Retrieve staff performance rankings and tiers', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/employees`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
    const first = body.data[0];
    assert.ok(first.fullName !== undefined);
    assert.ok(first.role !== undefined);
    assert.ok(typeof first.completionRate === 'number');
    assert.ok(first.performanceTier !== undefined);
  });

  test('6. CSV Export: Retrieve downloadable operational tasks dataset', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/export`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });

    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    const text = await res.text();
    assert.ok(text.includes('Task Number,Title,Status'));
    assert.ok(text.includes('Task A: Safety Valve Inspection'));
  });

  test('7. Cleanup: Delete Task A and Task B', async () => {
    await fetch(`${baseUrl}/api/v1/tasks/${taskBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}`, 'x-tenant-id': tenantId },
    });
    await fetch(`${baseUrl}/api/v1/tasks/${taskAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}`, 'x-tenant-id': tenantId },
    });
  });
});
