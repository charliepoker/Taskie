import {
  PrismaClient,
  TaskStatus,
  TaskPriority,
  ProjectRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@taskie.com' },
    update: {},
    create: {
      email: 'admin@taskie.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
    },
  });

  const johnUser = await prisma.user.upsert({
    where: { email: 'john@taskie.com' },
    update: {},
    create: {
      email: 'john@taskie.com',
      username: 'john_doe',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
    },
  });

  const janeUser = await prisma.user.upsert({
    where: { email: 'jane@taskie.com' },
    update: {},
    create: {
      email: 'jane@taskie.com',
      username: 'jane_smith',
      firstName: 'Jane',
      lastName: 'Smith',
      password: hashedPassword,
    },
  });

  console.log('✅ Created demo users');

  // Create demo projects
  const webProject = await prisma.project.upsert({
    where: { id: 'web-project-demo' },
    update: {},
    create: {
      id: 'web-project-demo',
      name: 'Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      color: '#0D65F2',
      ownerId: adminUser.id,
    },
  });

  const mobileProject = await prisma.project.upsert({
    where: { id: 'mobile-project-demo' },
    update: {},
    create: {
      id: 'mobile-project-demo',
      name: 'Mobile App Development',
      description: 'Native mobile application for iOS and Android platforms',
      color: '#DFB032',
      ownerId: johnUser.id,
    },
  });

  console.log('✅ Created demo projects');

  // Add project members
  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: adminUser.id,
        projectId: webProject.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      projectId: webProject.id,
      role: ProjectRole.OWNER,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: johnUser.id,
        projectId: webProject.id,
      },
    },
    update: {},
    create: {
      userId: johnUser.id,
      projectId: webProject.id,
      role: ProjectRole.MEMBER,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: janeUser.id,
        projectId: webProject.id,
      },
    },
    update: {},
    create: {
      userId: janeUser.id,
      projectId: webProject.id,
      role: ProjectRole.MEMBER,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: johnUser.id,
        projectId: mobileProject.id,
      },
    },
    update: {},
    create: {
      userId: johnUser.id,
      projectId: mobileProject.id,
      role: ProjectRole.OWNER,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: janeUser.id,
        projectId: mobileProject.id,
      },
    },
    update: {},
    create: {
      userId: janeUser.id,
      projectId: mobileProject.id,
      role: ProjectRole.ADMIN,
    },
  });

  console.log('✅ Added project members');

  // Create demo tasks
  const tasks = [
    {
      id: 'task-1',
      title: 'Design Homepage Layout',
      description: 'Create wireframes and mockups for the new homepage design',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assigneeId: janeUser.id,
      projectId: webProject.id,
      dueDate: new Date('2025-02-15'),
    },
    {
      id: 'task-2',
      title: 'Implement User Authentication',
      description:
        'Set up JWT-based authentication system with login/register functionality',
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      assigneeId: johnUser.id,
      projectId: webProject.id,
      dueDate: new Date('2025-02-10'),
    },
    {
      id: 'task-3',
      title: 'Database Schema Design',
      description:
        'Design and implement the database schema for user management',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      assigneeId: adminUser.id,
      projectId: webProject.id,
    },
    {
      id: 'task-4',
      title: 'Mobile App UI Framework',
      description:
        'Set up React Native framework and basic navigation structure',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      assigneeId: johnUser.id,
      projectId: mobileProject.id,
      dueDate: new Date('2025-02-20'),
    },
    {
      id: 'task-5',
      title: 'API Integration',
      description: 'Integrate mobile app with backend API endpoints',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: janeUser.id,
      projectId: mobileProject.id,
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }

  console.log('✅ Created demo tasks');

  // Create demo comments
  const comments = [
    {
      id: 'comment-1',
      content:
        "I've started working on the wireframes. Should have initial designs ready by tomorrow.",
      taskId: 'task-1',
      authorId: janeUser.id,
    },
    {
      id: 'comment-2',
      content:
        'Great progress! Make sure to consider mobile responsiveness in the design.',
      taskId: 'task-1',
      authorId: adminUser.id,
    },
    {
      id: 'comment-3',
      content:
        'The authentication system is more complex than expected. Might need an extra day.',
      taskId: 'task-2',
      authorId: johnUser.id,
    },
    {
      id: 'comment-4',
      content:
        'Database schema has been implemented and tested. Ready for review.',
      taskId: 'task-3',
      authorId: adminUser.id,
    },
  ];

  for (const comment of comments) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: {},
      create: comment,
    });
  }

  console.log('✅ Created demo comments');
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
