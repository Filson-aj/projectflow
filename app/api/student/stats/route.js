import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = session.user.id;
    const now = new Date();
    const startThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startLastWeek = new Date(startThisWeek);
    startLastWeek.setDate(startLastWeek.getDate() - 7);

    // Core counts
    const [
      totalProjects,
      approvedProjects,
      totalSubmissions,
      pendingSubmissions
    ] = await Promise.all([
      prisma.project.count({ where: { studentId } }),
      prisma.project.count({ where: { studentId, status: 'APPROVED' } }),
      prisma.submission.count({ where: { studentId } }),
      prisma.submission.count({ where: { studentId, status: 'PENDING' } })
    ]);

    // Trends: this week vs last week
    const [
      projectsThisWeek,
      projectsLastWeek,
      submissionsThisWeek,
      submissionsLastWeek
    ] = await Promise.all([
      prisma.project.count({ where: { studentId, createdAt: { gte: startThisWeek } } }),
      prisma.project.count({ where: { studentId, createdAt: { gte: startLastWeek, lt: startThisWeek } } }),
      prisma.submission.count({ where: { studentId, createdAt: { gte: startThisWeek } } }),
      prisma.submission.count({ where: { studentId, createdAt: { gte: startLastWeek, lt: startThisWeek } } })
    ]);

    const projectTrend = projectsThisWeek - projectsLastWeek;
    const submissionTrend = submissionsThisWeek - submissionsLastWeek;

    // Submission distribution
    const [approvedCount, pendingCount, revisionCount] = await Promise.all([
      prisma.submission.count({ where: { studentId, status: 'APPROVED' } }),
      prisma.submission.count({ where: { studentId, status: 'PENDING' } }),
      prisma.submission.count({ where: { studentId, status: 'NEEDS_REVISION' } })
    ]);

    // Weekly progress data (last 6 weeks)
    const weeklyData = [];
    for (let i = 5; i >= 0; i--) {
      const end = new Date(startThisWeek);
      end.setDate(end.getDate() - 7 * i);
      const start = new Date(end);
      start.setDate(end.getDate() - 7);
      const weekLabel = `Week${6 - i}`;
      const [pCount, sCount] = await Promise.all([
        prisma.project.count({ where: { studentId, createdAt: { gte: start, lt: end } } }),
        prisma.submission.count({ where: { studentId, createdAt: { gte: start, lt: end } } })
      ]);
      weeklyData.push({ week: weekLabel, projects: pCount, submissions: sCount });
    }

    // Progress score (approved/total)
    const progressScore = totalProjects > 0
      ? Math.round((approvedProjects / totalProjects) * 100)
      : 0;

    return NextResponse.json({
      totalProjects,
      approvedProjects,
      totalSubmissions,
      pendingSubmissions,
      projectTrend,
      submissionTrend,
      distribution: { approved: approvedCount, pending: pendingCount, needsRevision: revisionCount },
      progressScore,
      weeklyProgress: weeklyData
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}