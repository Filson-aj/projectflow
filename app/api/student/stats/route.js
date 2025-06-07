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

    const [
      totalProjects,
      approvedProjects,
      totalSubmissions,
      pendingSubmissions
    ] = await Promise.all([
      prisma.project.count({
        where: { studentId: session.user.id }
      }),
      prisma.project.count({
        where: { 
          studentId: session.user.id,
          status: 'APPROVED'
        }
      }),
      prisma.submission.count({
        where: { studentId: session.user.id }
      }),
      prisma.submission.count({
        where: { 
          studentId: session.user.id,
          status: 'PENDING'
        }
      })
    ]);

    return NextResponse.json({
      totalProjects,
      approvedProjects,
      totalSubmissions,
      pendingSubmissions
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}