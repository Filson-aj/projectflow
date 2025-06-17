import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'COORDINATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get coordinator's department
    const coordinator = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { coordinatedDepartment: true }
    });

    if (!coordinator?.coordinatedDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 400 });
    }

    const supervisors = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR',
        supervisorDepartmentId: coordinator.coordinatedDepartment.id
      },
      include: {
        supervisorDepartment: true,
        _count: {
          select: {
            supervisedProjects: true,
            supervisorAllocations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedSupervisors = supervisors.map(supervisor => ({
      ...supervisor,
      name: `${supervisor.firstName} ${supervisor.lastName}`,
      department: supervisor.supervisorDepartment?.name || 'N/A'
    }));

    return NextResponse.json(transformedSupervisors);
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'COORDINATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coordinator = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { coordinatedDepartment: true }
    });

    if (!coordinator?.coordinatedDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 400 });
    }

    const body = await request.json();
    const { firstName, lastName, email, password, areaOfResearch, maxStudents } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const supervisor = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'SUPERVISOR',
        supervisorDepartmentId: coordinator.coordinatedDepartment.id,
        areaOfResearch,
        maxStudents: parseInt(maxStudents) || 5,
        isFirstLogin: true
      },
      include: {
        supervisorDepartment: true
      }
    });

    const { password: _, ...safeSupervisor } = supervisor;
    return NextResponse.json(safeSupervisor);
  } catch (error) {
    console.error('Error creating supervisor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}