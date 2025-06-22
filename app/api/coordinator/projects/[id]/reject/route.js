import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'COORDINATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;

    // Verify the project belongs to coordinator's department
    const coordinator = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { coordinatedDepartment: true }
    });

    if (!coordinator?.coordinatedDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        departmentId: coordinator.coordinatedDepartment.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status: 'REJECTED' },
      include: {
        student: true,
        supervisor: true,
        department: true
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error rejecting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}