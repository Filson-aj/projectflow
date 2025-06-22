import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, department, sessionId, areaOfResearch, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !department || !sessionId || !areaOfResearch || !password) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Find department
    const departmentRecord = await prisma.department.findUnique({
      where: { code: department }
    });

    if (!departmentRecord) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 400 }
      );
    }

    // Verify session exists
    const sessionRecord = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!sessionRecord) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: 'STUDENT',
        areaOfResearch,
        studentDepartmentId: departmentRecord.id,
        sessionId: sessionId,
        isFirstLogin: false,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'User created successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}