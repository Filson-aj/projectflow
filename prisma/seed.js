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