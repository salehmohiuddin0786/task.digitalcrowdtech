const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { initSocket } = require('../src/sockets/socketHandler');

let server;
let baseUrl;
let socketPort;

before(async () => {
  await prisma.$connect();
  server = http.createServer(app);
  initSocket(server, ['*']);
  await new Promise((resolve) => {
    server.listen(0, () => {
      socketPort = server.address().port;
      baseUrl = `http://127.0.0.1:${socketPort}`;
      resolve();
    });
  });
});

after(async () => {
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

describe('Phase 5 — Real-Time WebSockets, Notifications & Recurring Tasks Engine', () => {
  let ownerToken = '';
  let employeeToken = '';
  let tenantId = '';
  let employeeUser;
  let sampleNotificationId = '';
  let createdRuleId = '';
  let generatedTaskId = '';

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
  });

  test('1. WebSocket Authentication & Connection: Client connects with JWT and joins rooms', async () => {
    const socket = Client(`http://127.0.0.1:${socketPort}`, {
      auth: { token: employeeToken },
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        socket.emit('join_tenant', { tenantId });
        socket.disconnect();
        resolve();
      });
      socket.on('connect_error', (err) => {
        reject(err);
      });
    });
  });

  test('2. WebSocket Guard: Connection without token is rejected', async () => {
    const socket = Client(`http://127.0.0.1:${socketPort}`, {
      transports: ['websocket'],
    });

    await new Promise((resolve) => {
      socket.on('connect_error', (err) => {
        assert.ok(err.message.includes('Authentication token required'));
        socket.disconnect();
        resolve();
      });
    });
  });

  test('3. Notifications API: Retrieve list, mark as read, and mark all read', async () => {
    // Create a notification directly for testing
    const createdNotif = await prisma.notification.create({
      data: {
        tenantId,
        userId: employeeUser.id,
        title: 'Phase 5 Test Notification',
        message: 'This is a test notification for Phase 5 verification.',
        type: 'TASK_ASSIGNED',
        isRead: false,
      },
    });
    sampleNotificationId = createdNotif.id;

    // List notifications
    const listRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: {
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const listData = await listRes.json();
    assert.equal(listRes.status, 200);
    assert.ok(listData.data.unreadCount >= 1);
    assert.ok(listData.data.notifications.some((n) => n.id === sampleNotificationId));

    // Mark single as read
    const readRes = await fetch(`${baseUrl}/api/v1/notifications/${sampleNotificationId}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(readRes.status, 200);

    // Mark all as read
    const markAllRes = await fetch(`${baseUrl}/api/v1/notifications/mark-all-read`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(markAllRes.status, 200);

    // Delete notification
    const delRes = await fetch(`${baseUrl}/api/v1/notifications/${sampleNotificationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${employeeToken}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(delRes.status, 200);
  });

  test('4. Recurring Tasks: Create, retrieve, and update recurrence rules', async () => {
    // Create rule
    const createRes = await fetch(`${baseUrl}/api/v1/tasks/recurrence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        frequency: 'DAILY',
        intervalDays: 1,
        titleTemplate: 'Daily Opening Checklist & Temperature Logging',
        description: 'Verify kitchen fridge temperature and log opening safety checks.',
        priority: 'HIGH',
      }),
    });

    const createData = await createRes.json();
    assert.equal(createRes.status, 201);
    assert.equal(createData.data.frequency, 'DAILY');
    assert.equal(createData.data.titleTemplate, 'Daily Opening Checklist & Temperature Logging');
    createdRuleId = createData.data.id;

    // List rules
    const listRes = await fetch(`${baseUrl}/api/v1/tasks/recurrence`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const listData = await listRes.json();
    assert.equal(listRes.status, 200);
    assert.ok(listData.data.some((r) => r.id === createdRuleId));

    // Update rule
    const updateRes = await fetch(`${baseUrl}/api/v1/tasks/recurrence/${createdRuleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        priority: 'URGENT',
      }),
    });
    const updateData = await updateRes.json();
    assert.equal(updateRes.status, 200);
    assert.equal(updateData.data.priority, 'URGENT');
  });

  test('5. Recurrence Generation Engine: Trigger scheduled run and verify Task instance creation', async () => {
    const genRes = await fetch(`${baseUrl}/api/v1/tasks/recurrence/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ forceAll: true }),
    });

    const genData = await genRes.json();
    assert.equal(genRes.status, 200);
    assert.ok(genData.data.tasksGenerated >= 1);

    const generatedTask = genData.data.tasks[0];
    generatedTaskId = generatedTask.id;
    assert.ok(generatedTask.title.includes('Daily Opening Checklist'));
    assert.equal(generatedTask.recurrenceId, createdRuleId);

    // Verify task exists in standard tasks query
    const taskRes = await fetch(`${baseUrl}/api/v1/tasks/${generatedTaskId}`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    const taskData = await taskRes.json();
    assert.equal(taskRes.status, 200);
    assert.equal(taskData.data.id, generatedTaskId);
  });

  test('6. Cleanup: Delete generated task and recurrence rule', async () => {
    if (generatedTaskId) {
      await fetch(`${baseUrl}/api/v1/tasks/${generatedTaskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'x-tenant-id': tenantId,
        },
      });
    }

    const delRuleRes = await fetch(`${baseUrl}/api/v1/tasks/recurrence/${createdRuleId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(delRuleRes.status, 200);
  });
});
