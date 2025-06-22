import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to enforce COORDINATOR-only
async function requireCoordinator() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'COORDINATOR') {
    throw new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 }
    );
  }
  return session;
}

export async function GET() {
  try {
    const session = await requireCoordinator();

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

    const projects = await prisma.project.findMany({
      where: {
        departmentId: coordinator.coordinatedDepartment.id
      },
      include: {
        student: true,
        supervisor: true,
        department: true,
        session: true,
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedProjects = projects.map(project => ({
      ...project,
      studentName: project.student ? `${project.student.firstName} ${project.student.lastName}` : 'N/A',
      supervisorName: project.supervisor ? `${project.supervisor.firstName} ${project.supervisor.lastName}` : 'N/A'
    }));

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}