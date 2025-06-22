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

        // Get students allocated to this supervisor
        const allocations = await prisma.allocation.findMany({
            where: {
                supervisorId: session.user.id
            },
            include: {
                student: {
                    include: {
                        studentDepartment: true,
                        session: true,
                        _count: {
                            select: {
                                studentProjects: true,
                                submissions: true
                            }
                        }
                    }
                },
                session: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const students = allocations.map(allocation => ({
            ...allocation.student,
            name: `${allocation.student.firstName} ${allocation.student.lastName}`,
            department: allocation.student.studentDepartment?.name || 'N/A',
            sessionName: allocation.session?.name || 'N/A',
            allocationDate: allocation.createdAt,
            projectCount: allocation.student._count.studentProjects,
            submissionCount: allocation.student._count.submissions,
        }));

        return NextResponse.json(students);
    } catch (error) {
        console.error('Error fetching supervisor students:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}