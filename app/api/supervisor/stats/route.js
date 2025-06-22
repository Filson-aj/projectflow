import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: supervisor dashboard stats with monthly trends (only active session allocations)
export async function GET(_request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supervisorId = session.user.id;
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalStudents,
      totalProjects,
      pendingSubmissions,
      completedProjects,
      allocationsThis,
      allocationsLast,
      projectsThis,
      projectsLast,
      pendingThis,
      pendingLast,
      completedThis,
      completedLast
    ] = await Promise.all([
      // count allocations only for active session
      prisma.allocation.count({
        where: { supervisorId, session: { isActive: true } }
      }),
      prisma.project.count({ where: { supervisorId } }),
      prisma.submission.count({ where: { project: { supervisorId }, status: 'PENDING' } }),
      prisma.project.count({ where: { supervisorId, status: 'COMPLETED' } }),
      // this month active session allocations
      prisma.allocation.count({
        where: {
          supervisorId,
          createdAt: { gte: startThisMonth },
          session: { isActive: true }
        }
      }),
      // last month active session allocations
      prisma.allocation.count({
        where: {
          supervisorId,
          createdAt: { gte: startLastMonth, lt: endLastMonth },
          session: { isActive: true }
        }
      }),
      // this month projects
      prisma.project.count({ where: { supervisorId, createdAt: { gte: startThisMonth } } }),
      // last month projects
      prisma.project.count({ where: { supervisorId, createdAt: { gte: startLastMonth, lt: endLastMonth } } }),
      // this month pending submissions
      prisma.submission.count({
        where: {
          project: { supervisorId },
          status: 'PENDING',
          createdAt: { gte: startThisMonth }
        }
      }),
      // last month pending submissions
      prisma.submission.count({
        where: {
          project: { supervisorId },
          status: 'PENDING',
          createdAt: { gte: startLastMonth, lt: endLastMonth }
        }
      }),
      // this month completed projects
      prisma.project.count({
        where: {
          supervisorId,
          status: 'COMPLETED',
          createdAt: { gte: startThisMonth }
        }
      }),
      // last month completed projects
      prisma.project.count({
        where: {
          supervisorId,
          status: 'COMPLETED',
          createdAt: { gte: startLastMonth, lt: endLastMonth }
        }
      })
    ]);

    // Compute trends
    const studentTrend = allocationsThis - allocationsLast;
    const projectTrend = projectsThis - projectsLast;
    const pendingTrend = pendingThis - pendingLast;
    const completedTrend = completedThis - completedLast;

    return NextResponse.json({
      totalStudents,
      totalProjects,
      pendingSubmissions,
      completedProjects,
      newStudents: allocationsThis,
      newProjects: projectsThis,
      newPendingSubmissions: pendingThis,
      newCompletedProjects: completedThis,
      studentTrend,
      projectTrend,
      pendingTrend,
      completedTrend
    });
  } catch (error) {
    console.error('Error fetching supervisor stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
