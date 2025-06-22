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

// GET: list supervisors in coordinator's department
export async function GET(_request) {
    try {
        const session = await requireCoordinator();

        // Fetch coordinator's dept
        const coordinator = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { coordinatedDepartment: true }
        });

        if (!coordinator?.coordinatedDepartment) {
            return NextResponse.json(
                { error: 'Department not found' },
                { status: 400 }
            );
        }

        const supervisors = await prisma.user.findMany({
            where: {
                role: 'SUPERVISOR',
                supervisorDepartmentId: coordinator.coordinatedDepartment.id
            },
            include: {
                supervisorDepartment: true,
                _count: {
                    select: {
                        supervisedProjects: true,
                        supervisorAllocations: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const transformed = supervisors.map(s => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            name: `${s.firstName} ${s.lastName}`,
            email: s.email,
            role: s.role,
            phone: s.phone || 'N/A',
            department: s.supervisorDepartment?.name || 'N/A',
            maxStudents: s.maxStudents,
            areaOfResearch: s.areaOfResearch,
            counts: s._count
        }));

        return NextResponse.json(transformed);
    } catch (error) {
        console.error('GET /supervisors error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: create a new supervisor under coordinator's department
export async function POST(request) {
    try {
        const session = await requireCoordinator();

        const coordinator = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { coordinatedDepartment: true }
        });

        if (!coordinator?.coordinatedDepartment) {
            return NextResponse.json(
                { error: 'Department not found' },
                { status: 400 }
            );
        }

        const { firstName, lastName, email, phone, password, areaOfResearch, maxStudents } = await request.json();

        if (!firstName || !lastName || !email || !phone || !password) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        const hashed = await bcrypt.hash(password, 12);

        const supervisor = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                password: hashed,
                role: 'SUPERVISOR',
                supervisorDepartmentId: coordinator.coordinatedDepartment.id,
                areaOfResearch,
                maxStudents: parseInt(maxStudents, 10) || 5,
                isFirstLogin: true
            },
            include: { supervisorDepartment: true }
        });

        const { password: _, ...publicData } = supervisor;
        return NextResponse.json(publicData);
    } catch (error) {
        console.error('POST /supervisors error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: update an existing supervisor under coordinator's department
export async function PUT(request) {
    try {
        const session = await requireCoordinator();

        const coordinator = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { coordinatedDepartment: true }
        });

        if (!coordinator?.coordinatedDepartment) {
            return NextResponse.json(
                { error: 'Department not found' },
                { status: 400 }
            );
        }

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Supervisor ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const updateData = {};
        if (body.firstName) updateData.firstName = body.firstName;
        if (body.lastName) updateData.lastName = body.lastName;
        if (body.email) updateData.email = body.email;
        if (body.phone) updateData.phone = body.phone;
        if (body.areaOfResearch !== undefined) updateData.areaOfResearch = body.areaOfResearch;
        if (body.maxStudents !== undefined) updateData.maxStudents = parseInt(body.maxStudents, 10) || undefined;
        if (body.password) updateData.password = await bcrypt.hash(body.password, 12);

        // Ensure supervisor belongs to same department
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing || existing.supervisorDepartmentId !== coordinator.coordinatedDepartment.id) {
            return NextResponse.json(
                { error: 'Supervisor not found in your department' },
                { status: 404 }
            );
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { supervisorDepartment: true }
        });

        const { password: _, ...publicData } = updated;
        return NextResponse.json(publicData);
    } catch (error) {
        console.error('PUT /supervisors error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: remove supervisor(s) under coordinator's department
export async function DELETE(request) {
    try {
        const session = await requireCoordinator();

        const coordinator = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { coordinatedDepartment: true }
        });

        if (!coordinator?.coordinatedDepartment) {
            return NextResponse.json(
                { error: 'Department not found' },
                { status: 400 }
            );
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');

        if (!ids.length) {
            return NextResponse.json(
                { error: 'Supervisor IDs are required' },
                { status: 400 }
            );
        }

        // Bulk delete only in your department
        await prisma.user.deleteMany({
            where: {
                id: { in: ids },
                supervisorDepartmentId: coordinator.coordinatedDepartment.id
            }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('DELETE /supervisors error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
