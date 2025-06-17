import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { supervisorId: session.user.id },
      include: {
        student: true,
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
      studentName: project.student ? `${project.student.firstName} ${project.student.lastName}` : 'N/A'
    }));

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error('Error fetching supervisor projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}