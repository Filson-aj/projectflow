import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Helper to enforce ADMIN-only
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    throw new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 }
    )
  }
  return session
}

export async function GET() {
  try {
    await requireAdmin()

    const users = await prisma.user.findMany({
      include: {
        coordinatedDepartment: true,
        supervisorDepartment: true,
        studentDepartment: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const usersWithDepartment = users.map(u => ({
      ...u,
      department:
        u.coordinatedDepartment ||
        u.supervisorDepartment ||
        u.studentDepartment
    }))

    return NextResponse.json(usersWithDepartment)
  } catch (err) {
    console.error('GET /users error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await requireAdmin()

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      departmentId,
      areaOfResearch,
      maxStudents
    } = await request.json()

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !role ||
      !departmentId
    ) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    const userData = {
      firstName,
      lastName,
      email,
      password: hashed,
      role,
      areaOfResearch,
      isFirstLogin: true
    }

    if (role === 'COORDINATOR') {
      userData.coordinatedDepartmentId = departmentId
    } else if (role === 'SUPERVISOR') {
      userData.supervisorDepartmentId = departmentId
      userData.maxStudents = parseInt(maxStudents) || 5
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        coordinatedDepartment: true,
        supervisorDepartment: true,
        studentDepartment: true
      }
    })

    const { password: _, ...safe } = user
    return NextResponse.json(safe)
  } catch (err) {
    console.error('POST /users error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    await requireAdmin()

    const url = new URL(request.url)

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      departmentId,
      areaOfResearch,
      maxStudents
    } = await request.json()

    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const updateData = {}

    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (email) updateData.email = email
    if (areaOfResearch !== undefined)
      updateData.areaOfResearch = areaOfResearch
    if (role) updateData.role = role
    if (maxStudents !== undefined)
      updateData.maxStudents = parseInt(maxStudents) || undefined
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    if (departmentId) {
      updateData.coordinatedDepartmentId = null
      updateData.supervisorDepartmentId = null
      updateData.studentDepartmentId = null

      if (role === 'COORDINATOR') {
        updateData.coordinatedDepartmentId = departmentId
      } else if (role === 'SUPERVISOR') {
        updateData.supervisorDepartmentId = departmentId
      } else if (role === 'STUDENT') {
        updateData.studentDepartmentId = departmentId
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        coordinatedDepartment: true,
        supervisorDepartment: true,
        studentDepartment: true
      }
    })

    const { password: _, ...safe } = user
    return NextResponse.json(safe)
  } catch (err) {
    console.error('PUT /users error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    // Ensure the requester is an admin
    await requireAdmin()

    const url = new URL(request.url)
    // Collect all ids from query string: ?ids=1&ids=2&ids=3...
    const ids = url.searchParams.getAll('ids')
    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Perform bulk delete
    await prisma.user.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    // 204 No Content on success
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /users error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

