import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const projectId = url.searchParams.get('projectId');

        let whereClause = {};

        // Filter based on user role
        switch (session.user.role) {
            case 'ADMIN':
                // Admin can see all submissions
                if (projectId) {
                    whereClause.projectId = projectId;
                }
                break;
            case 'COORDINATOR':
                // Coordinator can see submissions from their department
                const coordinator = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    include: { coordinatedDepartment: true }
                });

                if (!coordinator?.coordinatedDepartment) {
                    return NextResponse.json({ error: 'Department not found' }, { status: 400 });
                }

                whereClause = {
                    project: {
                        departmentId: coordinator.coordinatedDepartment.id
                    }
                };

                if (projectId) {
                    whereClause.projectId = projectId;
                }
                break;
            case 'SUPERVISOR':
                // Supervisor can see submissions from their supervised projects
                whereClause = {
                    project: {
                        supervisorId: session.user.id
                    }
                };

                if (projectId) {
                    whereClause.projectId = projectId;
                }
                break;
            case 'STUDENT':
                // Student can only see their own submissions
                whereClause.studentId = session.user.id;

                if (projectId) {
                    whereClause.projectId = projectId;
                }
                break;
            default:
                return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
        }

        const submissions = await prisma.submission.findMany({
            where: whereClause,
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
            },
            orderBy: { createdAt: 'desc' }
        });

        const transformedSubmissions = submissions.map(submission => ({
            ...submission,
            student: `${submission.student.firstName} ${submission.student.lastName}`,
            supervisor: submission.project.supervisor
                ? `${submission.project.supervisor.firstName} ${submission.project.supervisor.lastName}`
                : 'Not Assigned',
            project: submission.project.title,
            department: submission.project.department.name,
            session: submission.project.session?.name || 'No Session'
        }));

        return NextResponse.json(transformedSubmissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const title = formData.get('title');
        const description = formData.get('description');
        const projectId = formData.get('projectId');
        const file = formData.get('file');

        if (!title || !projectId || !file) {
            return NextResponse.json({ error: 'Title, project ID, and file are required' }, { status: 400 });
        }

        // Verify the project belongs to the student
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                studentId: session.user.id,
                status: 'APPROVED' // Only allow submissions for approved projects
            }
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found or not approved' }, { status: 404 });
        }

        // Validate file type and size
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX files are allowed'
            }, { status: 400 });
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads');
        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${originalName}`;
        const filePath = path.join(uploadsDir, fileName);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Create submission record
        const submission = await prisma.submission.create({
            data: {
                title,
                description: description || null,
                fileName: originalName,
                filePath: fileName, // Store relative path
                fileType: file.type,
                projectId,
                studentId: session.user.id,
                status: 'PENDING'
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

        return NextResponse.json({
            message: 'Submission uploaded successfully',
            submission
        });
    } catch (error) {
        console.error('Error creating submission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}