import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(_request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPERVISOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = params.id;

        // fetch the project (including its studentId)
        const project = await prisma.project.findFirst({
            where: { id: projectId },
            select: { id: true, studentId: true, status: true }
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // check if this student already has an approved project
        const alreadyApproved = await prisma.project.findFirst({
            where: {
                studentId: project.studentId,
                status: 'APPROVED'
            }
        });

        if (alreadyApproved) {
            return NextResponse.json(
                { error: 'This student already has an approved topic' },
                { status: 400 }
            );
        }

        // proceed with approval
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { status: 'APPROVED' },
            include: {
                student: true,
                supervisor: true,
                department: true
            }
        });

        return NextResponse.json(updatedProject);
    } catch (error) {
        console.error('Error approving project:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
