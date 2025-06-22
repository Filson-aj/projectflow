import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const submissionId = params.id;

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                project: {
                    include: {
                        supervisor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        department: true,
                        session: true
                    }
                }
            }
        });

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Check access permissions
        let hasAccess = false;

        switch (session.user.role) {
            case 'ADMIN':
                hasAccess = true;
                break;
            case 'COORDINATOR':
                const coordinator = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    include: { coordinatedDepartment: true }
                });
                hasAccess = coordinator?.coordinatedDepartment?.id === submission.project.departmentId;
                break;
            case 'SUPERVISOR':
                hasAccess = submission.project.supervisorId === session.user.id;
                break;
            case 'STUDENT':
                hasAccess = submission.studentId === session.user.id;
                break;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const transformedSubmission = {
            ...submission,
            student: `${submission.student.firstName} ${submission.student.lastName}`,
            supervisor: submission.project.supervisor
                ? `${submission.project.supervisor.firstName} ${submission.project.supervisor.lastName}`
                : 'Not Assigned',
            project: submission.project.title,
            department: submission.project.department.name,
            session: submission.project.session?.name || 'No Session'
        };

        return NextResponse.json(transformedSubmission);
    } catch (error) {
        console.error('Error fetching submission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['SUPERVISOR', 'COORDINATOR', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const submissionId = params.id;
        const body = await request.json();
        const { status, feedback } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        // Verify submission exists and user has access
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                project: {
                    include: {
                        department: true
                    }
                }
            }
        });

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Check access permissions
        let hasAccess = false;

        switch (session.user.role) {
            case 'ADMIN':
                hasAccess = true;
                break;
            case 'COORDINATOR':
                const coordinator = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    include: { coordinatedDepartment: true }
                });
                hasAccess = coordinator?.coordinatedDepartment?.id === submission.project.departmentId;
                break;
            case 'SUPERVISOR':
                hasAccess = submission.project.supervisorId === session.user.id;
                break;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status,
                feedback: feedback || null,
                updatedAt: new Date()
            },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                project: {
                    include: {
                        supervisor: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(updatedSubmission);
    } catch (error) {
        console.error('Error updating submission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const submissionId = params.id;

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                project: true
            }
        });

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Check access permissions
        let hasAccess = false;

        switch (session.user.role) {
            case 'ADMIN':
                hasAccess = true;
                break;
            case 'STUDENT':
                hasAccess = submission.studentId === session.user.id && submission.status === 'PENDING';
                break;
            case 'COORDINATOR':
                const coordinator = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    include: { coordinatedDepartment: true }
                });
                hasAccess = coordinator?.coordinatedDepartment?.id === submission.project.departmentId;
                break;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Delete file from filesystem
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join(process.cwd(), 'uploads', submission.filePath);

        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.warn('Could not delete file:', error.message);
        }

        // Delete submission record
        await prisma.submission.delete({
            where: { id: submissionId }
        });

        return NextResponse.json({ message: 'Submission deleted successfully' });
    } catch (error) {
        console.error('Error deleting submission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}