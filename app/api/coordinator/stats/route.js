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

    const departmentId = coordinator.coordinatedDepartment.id;

    const [
      totalSupervisors,
      totalStudents,
      pendingProjects,
      approvedProjects,
      totalProjects,
      totalAllocations
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: 'SUPERVISOR',
          supervisorDepartmentId: departmentId
        }
      }),
      prisma.user.count({
        where: {
          role: 'STUDENT',
          studentDepartmentId: departmentId
        }
      }),
      prisma.project.count({
        where: {
          departmentId: departmentId,
          status: 'PENDING'
        }
      }),
      prisma.project.count({
        where: {
          departmentId: departmentId,
          status: 'APPROVED'
        }
      }),
      prisma.project.count({
        where: {
          departmentId: departmentId
        }
      }),
      prisma.allocation.count({
        where: {
          departmentId: departmentId
        }
      })
    ]);

    return NextResponse.json({
      totalSupervisors,
      totalStudents,
      pendingProjects,
      approvedProjects,
      totalProjects,
      totalAllocations,
      newSupervisors: 0, // You can implement this based on date range
      newStudents: 0,    // You can implement this based on date range
      supervisorTrend: 0,
      studentTrend: 0,
      pendingTrend: 0,
      approvedTrend: 0
    });
  } catch (error) {
    console.error('Error fetching coordinator stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}