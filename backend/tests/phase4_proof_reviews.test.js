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

describe('Phase 4 — Proof of Execution, Evidence & Supervisor Review Tests', () => {
  let ownerToken = '';
  let employeeToken = '';
  let tenantId = '';
  let employeeUser;
  let taskId = '';
  let evidenceId = '';

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
    employeeUser = empData.data.user;

    // Create a task that requires PHOTO proof
    const taskRes = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        title: 'Deep Cleaning & Sanitization Verification',
        description: 'Sanitize kitchen counter and upload photo evidence before completing.',
        priority: 'HIGH',
        category: 'Hygiene',
        requiresProof: true,
        proofType: 'PHOTO',
        assigneeIds: [employeeUser.id],
      }),
    });
    const taskData = await taskRes.json();
    taskId = taskData.data.id;
  });

  test('1. Mandatory Proof Enforcement: Attempting to submit or complete without evidence fails with 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'SUBMITTED' }),
    });

    const body = await res.json();
    assert.equal(res.status, 422);
    assert.equal(body.success, false);
    assert.ok(body.message.includes('Proof of execution is required'));
  });

  test('2. Evidence Upload: Employee uploads photo proof of execution', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks/${taskId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        fileType: 'PHOTO',
        fileName: 'counter-cleaned.jpg',
        fileUrl: '/uploads/evidence/counter-cleaned.jpg',
        fileSize: 204800,
        mimeType: 'image/jpeg',
        caption: 'Counter disinfected and polished as per SOP.',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.fileType, 'PHOTO');
    assert.equal(body.data.fileName, 'counter-cleaned.jpg');
    assert.equal(body.data.caption, 'Counter disinfected and polished as per SOP.');

    evidenceId = body.data.id;
  });

  test('3. Verification Submission: With evidence present, employee can submit task for review', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'SUBMITTED' }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.data.status, 'SUBMITTED');
  });

  test('4. Role Protection: Employee cannot submit review decisions (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks/${taskId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        feedback: 'Self approval attempt',
      }),
    });

    assert.equal(res.status, 403);
  });

  test('5. Supervisor Review: Manager requests changes with detailed feedback', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks/${taskId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        decision: 'CHANGES_REQUESTED',
        feedback: 'The left side corner was missed. Please sanitize and re-upload photo.',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.data.decision, 'CHANGES_REQUESTED');
    assert.equal(body.data.feedback, 'The left side corner was missed. Please sanitize and re-upload photo.');

    // Verify task status was updated to CHANGES_REQUESTED
    const taskRes = await fetch(`${baseUrl}/api/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const taskBody = await taskRes.json();
    assert.equal(taskBody.data.status, 'CHANGES_REQUESTED');
  });

  test('6. Supervisor Review: Final approval transitions task to COMPLETED', async () => {
    const res = await fetch(`${baseUrl}/api/v1/tasks/${taskId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        feedback: 'Looks spotless now! Approved.',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.data.decision, 'APPROVED');

    // Verify task status is COMPLETED and completedAt is set
    const taskRes = await fetch(`${baseUrl}/api/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const taskBody = await taskRes.json();
    assert.equal(taskBody.data.status, 'COMPLETED');
    assert.ok(taskBody.data.completedAt !== null);
  });

  test('7. Review History & Evidence Listing: Retrieve full audit of evidence and reviews', async () => {
    // Get evidence
    const evRes = await fetch(`${baseUrl}/api/v1/tasks/${taskId}/evidence`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const evBody = await evRes.json();
    assert.equal(evRes.status, 200);
    assert.ok(evBody.data.length >= 1);

    // Get reviews
    const revRes = await fetch(`${baseUrl}/api/v1/tasks/${taskId}/reviews`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const revBody = await revRes.json();
    assert.equal(revRes.status, 200);
    assert.equal(revBody.data.length, 2); // 1 CHANGES_REQUESTED + 1 APPROVED
  });

  test('8. Cleanup: Delete evidence and task', async () => {
    const delEvRes = await fetch(`${baseUrl}/api/v1/tasks/${taskId}/evidence/${evidenceId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(delEvRes.status, 200);

    const delTaskRes = await fetch(`${baseUrl}/api/v1/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(delTaskRes.status, 200);
  });
});
