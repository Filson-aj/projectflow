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

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        studentDepartmentId: coordinator.coordinatedDepartment.id
      },
      include: {
        studentDepartment: true,
        session: true,
        _count: {
          select: {
            studentProjects: true,
            submissions: true
          }
        },
        studentAllocations: {
          include: {
            supervisor: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedStudents = students.map(student => ({
      ...student,
      name: `${student.firstName} ${student.lastName}`,
      department: student.studentDepartment?.name || 'N/A',
      supervisor: student.studentAllocations[0]?.supervisor ? 
        `${student.studentAllocations[0].supervisor.firstName} ${student.studentAllocations[0].supervisor.lastName}` : 
        'Not Assigned'
    }));

    return NextResponse.json(transformedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}