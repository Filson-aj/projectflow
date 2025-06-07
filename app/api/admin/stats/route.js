import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalUsers,
      totalDepartments,
      activeProjects,
      completedProjects
    ] = await Promise.all([
      prisma.user.count(),
      prisma.department.count(),
      prisma.project.count({
        where: {
          status: {
            in: ['APPROVED', 'ASSIGNED', 'IN_PROGRESS']
          }
        }
      }),
      prisma.project.count({
        where: { status: 'COMPLETED' }
      })
    ]);

    return NextResponse.json({
      totalUsers,
      totalDepartments,
      activeProjects,
      completedProjects
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}