import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      include: {
        coordinatedDepartment: true,
        supervisorDepartment: true,
        studentDepartment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add department field for easier access
    const usersWithDepartment = users.map(user => ({
      ...user,
      department: user.coordinatedDepartment || user.supervisorDepartment || user.studentDepartment
    }));

    return NextResponse.json(usersWithDepartment);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, password, role, departmentId, areaOfResearch, maxStudents } = body;

    if (!firstName || !lastName || !email || !password || !role || !departmentId) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      areaOfResearch,
      isFirstLogin: true
    };

    // Set department relationship based on role
    if (role === 'COORDINATOR') {
      userData.coordinatedDepartmentId = departmentId;
    } else if (role === 'SUPERVISOR') {
      userData.supervisorDepartmentId = departmentId;
      userData.maxStudents = parseInt(maxStudents) || 5;
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        coordinatedDepartment: true,
        supervisorDepartment: true,
        studentDepartment: true
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}