import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Utility: normalize & similarity
const normalize = str =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => [])
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
  }
  return dp[a.length][b.length]
}

const similarity = (s1, s2) => {
  const d = levenshtein(s1, s2)
  return 1 - d / Math.max(s1.length, s2.length)
}

// GET all
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: { studentId: session.user.id },
      include: { supervisor: true, department: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST new
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description } = await request.json()
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // normalize & similarity helpers (as before)
    const normalize = str =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    function levenshtein(a, b) {
      const dp = Array.from({ length: a.length + 1 }, () => [])
      for (let i = 0; i <= a.length; i++) dp[i][0] = i
      for (let j = 0; j <= b.length; j++) dp[0][j] = j
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
          )
        }
      }
      return dp[a.length][b.length]
    }

    const similarity = (s1, s2) => {
      const d = levenshtein(s1, s2)
      return 1 - d / Math.max(s1.length, s2.length)
    }

    const newNorm = normalize(title)
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 5)

    // fetch student's department
    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { studentDepartment: true }
    })
    if (!student?.studentDepartment) {
      return NextResponse.json(
        { error: 'Student department not found' },
        { status: 400 }
      )
    }
    const deptId = student.studentDepartment.id

    // duplicate-check in dept
    const recent = await prisma.project.findMany({
      where: { departmentId: deptId, createdAt: { gte: cutoff } },
      select: { title: true }
    })
    for (const { title: ex } of recent) {
      if (similarity(newNorm, normalize(ex)) >= 0.8) {
        return NextResponse.json(
          { error: 'A project with a very similar title already exists in your department within the last 5 years.' },
          { status: 400 }
        )
      }
    }

    // fetch active allocation to get supervisor & session
    const alloc = await prisma.allocation.findFirst({
      where: {
        studentId: session.user.id,
        session: { isActive: true }
      },
      include: { session: true }
    })
    if (!alloc) {
      return NextResponse.json(
        { error: 'No active allocation found for student.' },
        { status: 400 }
      )
    }

    // create with supervisorId & sessionId
    const project = await prisma.project.create({
      data: {
        title,
        description,
        studentId: session.user.id,
        departmentId: deptId,
        supervisorId: alloc.supervisorId,
        sessionId: alloc.sessionId,
        status: 'PENDING'
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


// PUT update
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    const { title, description } = await request.json()
    if (!title || !description) {
      return NextResponse.json(
        { error: 'title, and description are required' },
        { status: 400 },
      )
    }

    const project = await prisma.project.findUnique({
      where: { id, studentId: session.user.id },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const newNorm = normalize(title)
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 5)

    // fetch dept from existing
    const deptId =
      project.departmentId ||
      (
        await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { studentDepartment: true },
        })
      )?.studentDepartment?.id

    const recent = await prisma.project.findMany({
      where: {
        departmentId: deptId,
        createdAt: { gte: cutoff },
        id: { not: id },
      },
      select: { title: true },
    })

    for (const { title: ex } of recent) {
      if (similarity(newNorm, normalize(ex)) >= 0.8) {
        return NextResponse.json(
          {
            error:
              'Another project with a very similar title already exists in your department.',
          },
          { status: 400 },
        )
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { title, description },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const ids = url.searchParams.getAll('ids')
    if (!ids.length) {
      return NextResponse.json({ error: 'Project IDs are required' }, { status: 400 })
    }
    // Ensure all projects belong to the student
    const projects = await prisma.project.findMany({
      where: {
        id: { in: ids },
        studentId: session.user.id,
      },
    })
    if (projects.length !== ids.length) {
      return NextResponse.json(
        { error: 'One or more projects not found' },
        { status: 404 },
      )
    }
    // Delete all projects
    await prisma.project.deleteMany({
      where: {
        id: { in: ids },
        studentId: session.user.id,
      },
    })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

