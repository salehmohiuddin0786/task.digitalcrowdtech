// Seed script for TaskDigitalCrowd
// Digital Crowd Technologies
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TaskDigitalCrowd database seed...');

  // 1. Seed Roles
  const rolesData = [
    { name: 'SUPER_ADMIN', label: 'Platform Super Admin', description: 'Platform-level administrator' },
    { name: 'OWNER', label: 'Business Owner', description: 'Complete company administrator & owner' },
    { name: 'BRANCH_MANAGER', label: 'Branch Manager', description: 'Branch supervisor with task approval rights' },
    { name: 'TEAM_LEADER', label: 'Team Leader', description: 'Team supervisor and task assigner' },
    { name: 'EMPLOYEE', label: 'Employee', description: 'Task assignee with execution & evidence upload rights' },
    { name: 'VIEWER', label: 'Auditor / Viewer', description: 'Read-only access to company tasks and reports' },
  ];

  const roles = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { label: r.label, description: r.description },
      create: r,
    });
    roles[r.name] = role;
  }
  console.log('✅ Roles seeded:', Object.keys(roles).length);

  // 2. Seed Permissions
  const permissionsData = [
    // Tasks
    { slug: 'tasks.view', module: 'tasks', description: 'View assigned or accessible tasks' },
    { slug: 'tasks.create', module: 'tasks', description: 'Create new tasks' },
    { slug: 'tasks.edit', module: 'tasks', description: 'Edit task details' },
    { slug: 'tasks.delete', module: 'tasks', description: 'Delete tasks' },
    { slug: 'tasks.assign', module: 'tasks', description: 'Assign tasks to members' },
    { slug: 'tasks.submit', module: 'tasks', description: 'Submit task for review with proof' },
    { slug: 'tasks.review', module: 'tasks', description: 'Approve or reject submitted tasks' },
    { slug: 'tasks.override_dependency', module: 'tasks', description: 'Override blocked task dependencies' },
    // Branches & Teams
    { slug: 'branches.view', module: 'branches', description: 'View company branches' },
    { slug: 'branches.manage', module: 'branches', description: 'Create and update branches' },
    { slug: 'teams.view', module: 'teams', description: 'View teams' },
    { slug: 'teams.manage', module: 'teams', description: 'Create and update teams' },
    // Members & Roles
    { slug: 'members.view', module: 'members', description: 'View company employees' },
    { slug: 'members.invite', module: 'members', description: 'Invite new employees' },
    { slug: 'members.manage', module: 'members', description: 'Update roles and deactivate members' },
    // Reports & Billing
    { slug: 'reports.view', module: 'reports', description: 'View analytics and performance reports' },
    { slug: 'reports.export', module: 'reports', description: 'Export report data to CSV/PDF' },
    { slug: 'settings.manage', module: 'settings', description: 'Manage company settings and brand' },
    { slug: 'billing.manage', module: 'billing', description: 'Manage subscription and invoices' },
  ];

  const permissions = {};
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { slug: p.slug },
      update: { description: p.description, module: p.module },
      create: p,
    });
    permissions[p.slug] = perm;
  }
  console.log('✅ Permissions seeded:', Object.keys(permissions).length);

  // 3. Map Role Permissions
  const rolePermissionMap = {
    OWNER: Object.keys(permissions),
    BRANCH_MANAGER: [
      'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign', 'tasks.submit', 'tasks.review',
      'branches.view', 'teams.view', 'teams.manage', 'members.view', 'members.invite', 'reports.view', 'reports.export'
    ],
    TEAM_LEADER: [
      'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign', 'tasks.submit',
      'teams.view', 'members.view', 'reports.view'
    ],
    EMPLOYEE: [
      'tasks.view', 'tasks.submit', 'teams.view'
    ],
    VIEWER: [
      'tasks.view', 'branches.view', 'teams.view', 'members.view', 'reports.view'
    ]
  };

  for (const [roleName, permSlugs] of Object.entries(rolePermissionMap)) {
    const role = roles[roleName];
    if (!role) continue;
    for (const slug of permSlugs) {
      const perm = permissions[slug];
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }
  }
  console.log('✅ Role permissions mapped.');

  // 4. Seed SaaS Plans
  const plans = [
    { code: 'starter', name: 'Starter Plan', priceMonthly: 499, maxUsers: 5, maxBranches: 1, featuresJson: JSON.stringify(['Up to 5 Users', '1 Branch', 'Task Boards', 'Basic Reports']) },
    { code: 'business', name: 'Business Plan', priceMonthly: 1499, maxUsers: 20, maxBranches: 3, featuresJson: JSON.stringify(['Up to 20 Users', '3 Branches', 'Kanban & Calendar', 'Evidence Verification', 'Export Reports']) },
    { code: 'growth', name: 'Growth Plan', priceMonthly: 2999, maxUsers: 50, maxBranches: 10, featuresJson: JSON.stringify(['Up to 50 Users', '10 Branches', 'Automated Recurrence', 'Priority Alerts', 'Dedicated Support']) },
    { code: 'enterprise', name: 'Enterprise Plan', priceMonthly: 9999, maxUsers: 500, maxBranches: 50, featuresJson: JSON.stringify(['Unlimited Possibilities', 'Custom Integrations', 'SLA Guarantee', 'Dedicated Account Manager']) },
  ];

  for (const pl of plans) {
    await prisma.plan.upsert({
      where: { code: pl.code },
      update: pl,
      create: pl,
    });
  }
  console.log('✅ Subscription plans seeded.');

  // 5. Seed Demo Tenant: Digital Crowd Technologies
  const tenantSlug = 'digital-crowd-technologies';
  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Digital Crowd Technologies',
        slug: tenantSlug,
        domain: 'tasks.digitalcrowdtech.in',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        planTier: 'growth',
        maxUsers: 50,
        maxBranches: 10,
      },
    });
  }
  console.log('✅ Tenant initialized:', tenant.name);

  // 6. Seed Branches
  const hqBranch = await prisma.branch.upsert({
    where: { id: 'branch-hq-hyd' },
    update: {},
    create: {
      id: 'branch-hq-hyd',
      tenantId: tenant.id,
      name: 'Headquarters - Hyderabad',
      code: 'HQ-HYD',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500081',
    },
  });

  const blrBranch = await prisma.branch.upsert({
    where: { id: 'branch-blr-tech' },
    update: {},
    create: {
      id: 'branch-blr-tech',
      tenantId: tenant.id,
      name: 'Tech Center - Bengaluru',
      code: 'BLR-01',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560001',
    },
  });

  // 7. Seed Teams
  const engTeam = await prisma.team.upsert({
    where: { id: 'team-engineering' },
    update: {},
    create: {
      id: 'team-engineering',
      tenantId: tenant.id,
      branchId: hqBranch.id,
      name: 'Engineering Team',
      description: 'Platform architecture and frontend/backend engineering',
    },
  });

  const opsTeam = await prisma.team.upsert({
    where: { id: 'team-operations' },
    update: {},
    create: {
      id: 'team-operations',
      tenantId: tenant.id,
      branchId: hqBranch.id,
      name: 'Operations & QA',
      description: 'Operational execution, QA audits, and delivery tracking',
    },
  });

  // 8. Seed Default Users
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const usersData = [
    {
      email: 'admin@digitalcrowdtech.in',
      fullName: 'Usama Admin',
      phone: '+91 9876543210',
      role: 'OWNER',
      branchId: hqBranch.id,
      designation: 'Managing Director & Founder',
      isPlatformAdmin: true,
    },
    {
      email: 'manager@digitalcrowdtech.in',
      fullName: 'Vikram Sharma',
      phone: '+91 9876543211',
      role: 'BRANCH_MANAGER',
      branchId: hqBranch.id,
      designation: 'General Operations Manager',
      isPlatformAdmin: false,
    },
    {
      email: 'lead@digitalcrowdtech.in',
      fullName: 'Ananya Rao',
      phone: '+91 9876543212',
      role: 'TEAM_LEADER',
      branchId: hqBranch.id,
      designation: 'Tech Lead',
      isPlatformAdmin: false,
    },
    {
      email: 'employee@digitalcrowdtech.in',
      fullName: 'Rahul Verma',
      phone: '+91 9876543213',
      role: 'EMPLOYEE',
      branchId: hqBranch.id,
      designation: 'Full Stack Engineer',
      isPlatformAdmin: false,
    },
  ];

  const seededUsers = {};
  for (const u of usersData) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: u.email,
          fullName: u.fullName,
          phone: u.phone,
          passwordHash,
          isPlatformAdmin: u.isPlatformAdmin,
          emailVerifiedAt: new Date(),
        },
      });
    }

    // Tenant Member
    const role = roles[u.role];
    const member = await prisma.tenantMember.upsert({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id,
        },
      },
      update: {
        roleId: role.id,
        branchId: u.branchId,
        designation: u.designation,
      },
      create: {
        tenantId: tenant.id,
        userId: user.id,
        roleId: role.id,
        branchId: u.branchId,
        designation: u.designation,
      },
    });

    seededUsers[u.email] = { user, member };
  }
  console.log('✅ Users & Tenant Members seeded with default password: Password@123');

  // Assign team member
  if (seededUsers['employee@digitalcrowdtech.in']) {
    await prisma.teamMember.upsert({
      where: {
        teamId_memberId: {
          teamId: engTeam.id,
          memberId: seededUsers['employee@digitalcrowdtech.in'].member.id,
        },
      },
      update: {},
      create: {
        teamId: engTeam.id,
        memberId: seededUsers['employee@digitalcrowdtech.in'].member.id,
        isLeader: false,
      },
    });
  }

  // 9. Seed Sample Initial Tasks for Phase 1 Dashboard Demonstration
  const ownerUser = seededUsers['admin@digitalcrowdtech.in'].user;
  const employeeUser = seededUsers['employee@digitalcrowdtech.in'].user;

  const sampleTasks = [
    {
      title: 'Setup Brand Palette & Design Tokens',
      description: 'Implement Deep Purple (#4C2365), Medium Purple (#7F5D99), Soft Purple (#9E7EB5), and Light Lavender (#C4A4DA) CSS variables and Tailwind theme tokens.',
      priority: 'HIGH',
      status: 'COMPLETED',
      category: 'Design System',
      branchId: hqBranch.id,
      teamId: engTeam.id,
      dueDate: new Date(Date.now() + 86400000 * 2),
      completedAt: new Date(),
      requiresProof: false,
    },
    {
      title: 'Build Multi-Tenant Authentication & Session Rotation',
      description: 'Implement secure JWT login, refresh tokens, tenant switching, and role-based permissions validation.',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      category: 'Security & Auth',
      branchId: hqBranch.id,
      teamId: engTeam.id,
      dueDate: new Date(Date.now() + 86400000 * 1),
      requiresProof: true,
      proofType: 'PHOTO',
    },
    {
      title: 'Configure Real-time Socket.IO Task Events',
      description: 'Establish authenticated rooms per tenant/branch and broadcast task state changes in real-time.',
      priority: 'NORMAL',
      status: 'PENDING',
      category: 'Real-time Systems',
      branchId: hqBranch.id,
      teamId: engTeam.id,
      dueDate: new Date(Date.now() + 86400000 * 3),
      requiresProof: false,
    },
    {
      title: 'End-of-Day Store & Server Audit',
      description: 'Verify all branch servers, security keys, and daily operational reports are synced and signed off.',
      priority: 'HIGH',
      status: 'SUBMITTED',
      category: 'Operations',
      branchId: hqBranch.id,
      teamId: opsTeam.id,
      dueDate: new Date(Date.now() + 86400000 * 1),
      requiresProof: true,
      proofType: 'BOTH',
    },
    {
      title: 'Database Backup and Redundancy Verification',
      description: 'Execute automated MySQL dump verification and verify replication health status.',
      priority: 'URGENT',
      status: 'PENDING',
      category: 'Infrastructure',
      branchId: blrBranch.id,
      teamId: engTeam.id,
      dueDate: new Date(Date.now() - 86400000 * 1), // Overdue intentionally for dashboard metrics demonstration
      requiresProof: false,
    },
  ];

  for (const t of sampleTasks) {
    const existing = await prisma.task.findFirst({
      where: { tenantId: tenant.id, title: t.title },
    });
    if (!existing) {
      const createdTask = await prisma.task.create({
        data: {
          tenantId: tenant.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: t.status,
          category: t.category,
          branchId: t.branchId,
          teamId: t.teamId,
          createdById: ownerUser.id,
          dueDate: t.dueDate,
          completedAt: t.completedAt,
          requiresProof: t.requiresProof,
          proofType: t.proofType,
          assignments: {
            create: [
              { userId: employeeUser.id },
            ],
          },
          checklists: {
            create: [
              { title: 'Review implementation requirements', isCompleted: true },
              { title: 'Execute verification tests', isCompleted: t.status === 'COMPLETED' },
            ],
          },
          activityLogs: {
            create: [
              {
                userId: ownerUser.id,
                action: 'CREATED',
                metadata: JSON.stringify({ note: 'Initial task created during system initialization' }),
              },
            ],
          },
        },
      });

      // Also create an in-app notification for the employee
      await prisma.notification.create({
        data: {
          tenantId: tenant.id,
          userId: employeeUser.id,
          title: `New Task Assigned: ${t.title}`,
          message: `You have been assigned to "${t.title}" with priority ${t.priority}.`,
          type: 'TASK_ASSIGNED',
          entityType: 'task',
          entityId: createdTask.id,
          isRead: false,
        },
      });
    }
  }

  console.log('✅ Demo tasks and notifications seeded successfully.');
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
