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

describe('Phase 3 — Task Management Lifecycle, Checklists, & Workflow Tests', () => {
  let ownerToken = '';
  let employeeToken = '';
  let tenantId = '';
  let employeeUser;
  let createdTaskId = '';
  let checklistItemId = '';

  before(async () => {
    // 1. Authenticate Owner
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

    // 2. Authenticate Employee
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
    employeeUser = empData.data.user;
  });

  test('1. Task Creation: Owner creates a task with checklist items and assignment', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        title: 'Phase 3 Verification Task',
        description: 'Comprehensive test task for Phase 3 endpoints',
        priority: 'HIGH',
        category: 'Operations',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        assigneeIds: [employeeUser.id],
        checklistItems: ['Initial setup verification', 'Integration check'],
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.title, 'Phase 3 Verification Task');
    assert.equal(body.data.priority, 'HIGH');
    assert.equal(body.data.assignments.length, 1);
    assert.equal(body.data.checklists.length, 2);

    createdTaskId = body.data.id;
    checklistItemId = body.data.checklists[0].id;
  });

  test('2. My Tasks: Assigned employee sees the newly assigned task', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks/my-tasks`, {
      headers: {
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(body.data));
    const found = body.data.some((t) => t.id === createdTaskId);
    assert.ok(found, 'Created task should appear in employee personal task list');
  });

  test('3. Checklist Management: Toggle checklist item status & add new checklist item', async () => {
    // Toggle item
    const toggleRes = await fetch(
      `${baseUrl}/api/v1/tasks/${createdTaskId}/checklists/${checklistItemId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${employeeToken}`,
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ isCompleted: true }),
      }
    );
    const toggleBody = await toggleRes.json();
    assert.equal(toggleRes.status, 200);
    assert.equal(toggleBody.data.isCompleted, true);

    // Add new checklist item
    const addRes = await fetch(`${baseUrl}/api/v1/tasks/${createdTaskId}/checklists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ title: 'Third test checklist step' }),
    });
    const addBody = await addRes.json();
    assert.equal(addRes.status, 201);
    assert.equal(addBody.data.title, 'Third test checklist step');
  });

  test('4. Task Collaboration: Post and fetch comments on task', async () => {
    const postRes = await fetch(`${baseUrl}/api/v1/tasks/${createdTaskId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ content: 'I have started work on the first checklist item.' }),
    });
    const postBody = await postRes.json();
    assert.equal(postRes.status, 201);
    assert.equal(postBody.data.content, 'I have started work on the first checklist item.');

    const listRes = await fetch(`${baseUrl}/api/v1/tasks/${createdTaskId}/comments`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const listBody = await listRes.json();
    assert.equal(listRes.status, 200);
    assert.ok(listBody.data.length >= 1);
    assert.equal(listBody.data[0].content, 'I have started work on the first checklist item.');
  });

  test('5. Status Transitions & Role Guard: Employee can transition to IN_PROGRESS, but cannot complete without manager approval', async () => {
    // Transition to IN_PROGRESS by employee -> Allowed
    const inProgressRes = await fetch(`${baseUrl}/api/v1/tasks/${createdTaskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert.equal(inProgressRes.status, 200);

    // Attempt to mark COMPLETED directly by employee -> Forbidden (403)
    const forbiddenRes = await fetch(`${baseUrl}/api/v1/tasks/${createdTaskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    assert.equal(forbiddenRes.status, 403);

    // Owner approves and completes the task -> Allowed (200)
    const approveRes = await fetch(`${baseUrl}/api/v1/tasks/${createdTaskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const approveBody = await approveRes.json();
    assert.equal(approveRes.status, 200);
    assert.equal(approveBody.data.status, 'COMPLETED');
  });

  test('6. Activity Timeline: Audit logs track creation, status change, and comments', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks/${createdTaskId}/activity`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(body.data));
    const actions = body.data.map((l) => l.action);
    assert.ok(actions.includes('CREATED'), 'Should have logged task creation');
    assert.ok(actions.includes('STATUS_CHANGED'), 'Should have logged status transitions');
    assert.ok(actions.includes('COMMENTED'), 'Should have logged comment additions');
  });

  test('7. Cleanup: Delete task and verify non-existence', async () => {
    const delRes = await fetch(`${baseUrl}/api/v1/tasks/${createdTaskId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(delRes.status, 200);

    const checkRes = await fetch(`${baseUrl}/api/v1/tasks/${createdTaskId}`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(checkRes.status, 404);
  });
});
