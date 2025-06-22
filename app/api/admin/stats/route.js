import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: admin dashboard stats with monthly trends
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalDepartments,
      activeProjects,
      completedProjects,
      newUsersThis,
      newUsersLast,
      newDepartmentsThis,
      newDepartmentsLast,
      activeThis,
      activeLast,
      completedThis,
      completedLast
    ] = await Promise.all([
      prisma.user.count(),
      prisma.department.count(),
      prisma.project.count({ where: { status: { in: ['APPROVED', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.project.count({ where: { status: 'COMPLETED' } }),
      // New users
      prisma.user.count({ where: { createdAt: { gte: startThisMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startLastMonth, lt: endLastMonth } } }),
      // New departments
      prisma.department.count({ where: { createdAt: { gte: startThisMonth } } }),
      prisma.department.count({ where: { createdAt: { gte: startLastMonth, lt: endLastMonth } } }),
      // Active projects trends
      prisma.project.count({ where: { status: { in: ['APPROVED', 'ASSIGNED', 'IN_PROGRESS'] }, createdAt: { gte: startThisMonth } } }),
      prisma.project.count({ where: { status: { in: ['APPROVED', 'ASSIGNED', 'IN_PROGRESS'] }, createdAt: { gte: startLastMonth, lt: endLastMonth } } }),
      // Completed projects trends
      prisma.project.count({ where: { status: 'COMPLETED', createdAt: { gte: startThisMonth } } }),
      prisma.project.count({ where: { status: 'COMPLETED', createdAt: { gte: startLastMonth, lt: endLastMonth } } })
    ]);

    const userTrend = newUsersThis - newUsersLast;
    const deptTrend = newDepartmentsThis - newDepartmentsLast;
    const activeTrend = activeThis - activeLast;
    const completedTrend = completedThis - completedLast;

    return NextResponse.json({
      totalUsers,
      totalDepartments,
      activeProjects,
      completedProjects,
      newUsers: newUsersThis,
      newDepartments: newDepartmentsThis,
      newActiveProjects: activeThis,
      newCompletedProjects: completedThis,
      userTrend,
      deptTrend,
      activeTrend,
      completedTrend
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
