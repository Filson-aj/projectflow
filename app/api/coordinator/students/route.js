import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Helper to enforce COORDINATOR-only
async function requireCoordinator() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'COORDINATOR') {
        throw new NextResponse(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401 }
        );
    }
    return session;
}

// GET: list students in coordinator's department
export async function GET(_request) {
    try {
        const session = await requireCoordinator();

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
                    include: { supervisor: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const transformed = students.map(s => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            email: s.email,
            phone: s.phone || 'N/A',
            role: s.role,
            department: s.studentDepartment?.name || 'N/A',
            areaOfResearch: s.areaOfResearch || 'N/A',
            session: s.session || null,
            projectCount: s._count.studentProjects,
            submissionCount: s._count.submissions,
            supervisor: s.studentAllocations[0]?.supervisor
                ? `${s.studentAllocations[0].supervisor.firstName} ${s.studentAllocations[0].supervisor.lastName}`
                : 'Not Assigned'
        }));

        return NextResponse.json(transformed);
    } catch (error) {
        console.error('GET /students error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: update a student in coordinator's department
export async function PUT(request) {
    try {
        const session = await requireCoordinator();

        const coordinator = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { coordinatedDepartment: true }
        });
        if (!coordinator?.coordinatedDepartment) {
            return NextResponse.json({ error: 'Department not found' }, { status: 400 });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const updateData = {};
        if (body.firstName) updateData.firstName = body.firstName;
        if (body.lastName) updateData.lastName = body.lastName;
        if (body.email) updateData.email = body.email;
        if (body.password) updateData.password = await bcrypt.hash(body.password, 12);
        if (body.sessionId !== undefined) updateData.sessionId = body.sessionId;

        // ensure student belongs to coordinator's department
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing || existing.studentDepartmentId !== coordinator.coordinatedDepartment.id) {
            return NextResponse.json({ error: 'Student not found in your department' }, { status: 404 });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { studentDepartment: true, studentAllocations: { include: { supervisor: true } }, _count: { select: { studentProjects: true, submissions: true } } }
        });

        const response = {
            id: updated.id,
            name: `${updated.firstName} ${updated.lastName}`,
            email: updated.email,
            department: updated.studentDepartment?.name || 'N/A',
            session: updated.session || null,
            projectCount: updated._count.studentProjects,
            submissionCount: updated._count.submissions,
            supervisor: updated.studentAllocations[0]?.supervisor
                ? `${updated.studentAllocations[0].supervisor.firstName} ${updated.studentAllocations[0].supervisor.lastName}`
                : 'Not Assigned'
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('PUT /students error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: remove student(s) from coordinator's department
export async function DELETE(request) {
    try {
        const session = await requireCoordinator();

        const coordinator = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { coordinatedDepartment: true }
        });
        if (!coordinator?.coordinatedDepartment) {
            return NextResponse.json({ error: 'Department not found' }, { status: 400 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');
        if (!ids.length) {
            return NextResponse.json({ error: 'Student IDs are required' }, { status: 400 });
        }

        await prisma.user.deleteMany({
            where: {
                id: { in: ids },
                studentDepartmentId: coordinator.coordinatedDepartment.id
            }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('DELETE /students error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
