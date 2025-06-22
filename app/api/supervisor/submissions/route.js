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

        const submissions = await prisma.submission.findMany({
            where: {
                project: {
                    supervisorId: session.user.id
                }
            },
            include: {
                student: true,
                project: {
                    include: {
                        session: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const transformedSubmissions = submissions.map(submission => ({
            ...submission,
            studentName: submission.student ? `${submission.student.firstName} ${submission.student.lastName}` : 'N/A',
            projectTitle: submission.project?.title || 'N/A'
        }));

        return NextResponse.json(transformedSubmissions);
    } catch (error) {
        console.error('Error fetching supervisor submissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}