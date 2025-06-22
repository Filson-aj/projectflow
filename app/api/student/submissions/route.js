import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissions = await prisma.submission.findMany({
      where: { studentId: session.user.id },
      include: {
        project: {
          include: {
            supervisor: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            department: true,
            session: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedSubmissions = submissions.map(submission => ({
      ...submission,
      projectTitle: submission.project.title,
      supervisorName: submission.project.supervisor 
        ? `${submission.project.supervisor.firstName} ${submission.project.supervisor.lastName}` 
        : 'Not Assigned',
      departmentName: submission.project.department.name,
      sessionName: submission.project.session?.name || 'No Session'
    }));

    return NextResponse.json(transformedSubmissions);
  } catch (error) {
    console.error('Error fetching student submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}