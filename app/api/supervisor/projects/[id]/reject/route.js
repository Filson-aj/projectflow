import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPERVISOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = params.id;

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
            }
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { status: 'REJECTED' },
            include: {
                student: true,
                supervisor: true,
                department: true
            }
        });

        return NextResponse.json(updatedProject);
    } catch (error) {
        console.error('Error rejecting project:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}