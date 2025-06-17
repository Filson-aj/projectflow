const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('password', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@system.com' },
    update: {},
    create: {
      email: 'admin@system.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isFirstLogin: true,
    },
  });

  // Create sample departments
  const computerScienceDept = await prisma.department.upsert({
    where: { code: 'CS' },
    update: {},
    create: {
      name: 'Computer Science',
      code: 'CS',
      description: 'Department of Computer Science and Information Technology',
    },
  });

  const engineeringDept = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: {},
    create: {
      name: 'Engineering',
      code: 'ENG',
      description: 'Department of Engineering and Applied Sciences',
    },
  });

  // Create sample sessions
  const session2024 = await prisma.session.upsert({
    where: { name: '2024/2025 Academic Session' },
    update: {},
    create: {
      name: '2024/2025 Academic Session',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-08-31'),
      isActive: true,
    },
  });

  const session2023 = await prisma.session.upsert({
    where: { name: '2023/2024 Academic Session' },
    update: {},
    create: {
      name: '2023/2024 Academic Session',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-08-31'),
      isActive: false,
    },
  });

  // Create sample coordinator
  const coordinator = await prisma.user.upsert({
    where: { email: 'coordinator.cs@system.com' },
    update: {},
    create: {
      email: 'coordinator.cs@system.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Coordinator',
      role: 'COORDINATOR',
      coordinatedDepartmentId: computerScienceDept.id,
      isFirstLogin: true,
    },
  });

  // Create sample supervisor
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor.cs@system.com' },
    update: {},
    create: {
      email: 'supervisor.cs@system.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Supervisor',
      role: 'SUPERVISOR',
      supervisorDepartmentId: computerScienceDept.id,
      areaOfResearch: 'Machine Learning, Artificial Intelligence',
      maxStudents: 5,
      isFirstLogin: true,
    },
  });

  // Create sample student
  const student = await prisma.user.upsert({
    where: { email: 'student.cs@system.com' },
    update: {},
    create: {
      email: 'student.cs@system.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Student',
      role: 'STUDENT',
      studentDepartmentId: computerScienceDept.id,
      sessionId: session2024.id,
      areaOfResearch: 'Machine Learning, Data Science',
      isFirstLogin: false,
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });