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

    const [
      totalStudents,
      totalProjects,
      pendingSubmissions,
      completedProjects
    ] = await Promise.all([
      prisma.allocation.count({
        where: { supervisorId: session.user.id }
      }),
      prisma.project.count({
        where: { supervisorId: session.user.id }
      }),
      prisma.submission.count({
        where: {
          project: {
            supervisorId: session.user.id
          },
          status: 'PENDING'
        }
      }),
      prisma.project.count({
        where: {
          supervisorId: session.user.id,
          status: 'COMPLETED'
        }
      })
    ]);

    return NextResponse.json({
      totalStudents,
      totalProjects,
      pendingSubmissions,
      completedProjects
    });
  } catch (error) {
    console.error('Error fetching supervisor stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}