import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: coordinator dashboard stats with monthly trends
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'COORDINATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find coordinator and dept
        const coordinator = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { coordinatedDepartment: true }
        });
        if (!coordinator?.coordinatedDepartment) {
            return NextResponse.json({ error: 'Department not found' }, { status: 400 });
        }

        const deptId = coordinator.coordinatedDepartment.id;

        // Date boundaries
        const now = new Date();
        const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Parallel counts
        const [
            totalSupervisors,
            totalStudents,
            pendingProjects,
            approvedProjects,
            totalProjects,
            totalAllocations,
            newSupervisorsThis,
            newSupervisorsLast,
            newStudentsThis,
            newStudentsLast,
            pendingLast,
            approvedLast
        ] = await Promise.all([
            prisma.user.count({ where: { role: 'SUPERVISOR', supervisorDepartmentId: deptId } }),
            prisma.user.count({ where: { role: 'STUDENT', studentDepartmentId: deptId } }),
            prisma.project.count({ where: { departmentId: deptId, status: 'PENDING' } }),
            prisma.project.count({ where: { departmentId: deptId, status: 'APPROVED' } }),
            prisma.project.count({ where: { departmentId: deptId } }),
            prisma.allocation.count({ where: { departmentId: deptId } }),
            // New this month
            prisma.user.count({ where: { role: 'SUPERVISOR', supervisorDepartmentId: deptId, createdAt: { gte: startThisMonth } } }),
            // New last month
            prisma.user.count({ where: { role: 'SUPERVISOR', supervisorDepartmentId: deptId, createdAt: { gte: startLastMonth, lt: endLastMonth } } }),
            prisma.user.count({ where: { role: 'STUDENT', studentDepartmentId: deptId, createdAt: { gte: startThisMonth } } }),
            prisma.user.count({ where: { role: 'STUDENT', studentDepartmentId: deptId, createdAt: { gte: startLastMonth, lt: endLastMonth } } }),
            // Last month project trends
            prisma.project.count({ where: { departmentId: deptId, status: 'PENDING', createdAt: { gte: startLastMonth, lt: endLastMonth } } }),
            prisma.project.count({ where: { departmentId: deptId, status: 'APPROVED', createdAt: { gte: startLastMonth, lt: endLastMonth } } })
        ]);

        // Compute trends (difference)
        const supervisorTrend = newSupervisorsThis - newSupervisorsLast;
        const studentTrend = newStudentsThis - newStudentsLast;
        const pendingTrend = pendingProjects - pendingLast;
        const approvedTrend = approvedProjects - approvedLast;

        return NextResponse.json({
            totalSupervisors,
            totalStudents,
            pendingProjects,
            approvedProjects,
            totalProjects,
            totalAllocations,
            newSupervisors: newSupervisorsThis,
            newStudents: newStudentsThis,
            supervisorTrend,
            studentTrend,
            pendingTrend,
            approvedTrend
        });
    } catch (error) {
        console.error('Error fetching coordinator stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
