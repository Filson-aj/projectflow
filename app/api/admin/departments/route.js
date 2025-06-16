import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      include: {
        coordinator: true,
        supervisors: true,
        students: true,
        _count: {
          select: {
            supervisors: true,
            students: true,
            projects: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
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
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        description
      }
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Ensure admin
    await requireAdmin()

    // Grab the department ID from the query string
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      )
    }

    // Pull out the fields
    const { name, code, description } = await request.json()

    // Ensure at least one field is present
    if (!name && !code && description === undefined) {
      return NextResponse.json(
        { error: 'Nothing to update' },
        { status: 400 }
      )
    }

    // Build up the update payload
    const data = {}
    if (name) data.name = name
    if (code) data.code = code
    if (description !== undefined) data.description = description

    // Perform the update with Prisma
    const department = await prisma.department.update({
      where: { id },
      data
    })

    // Return the updated record
    return NextResponse.json(department)
  } catch (error) {
    console.error('Error updating department:', error)
    // If requireAdmin threw a NextResponse, let it bubble up
    if (error instanceof NextResponse) throw error

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    // Check admin
    await requireAdmin();

    // Grab all `ids` from query string: ?ids=1&ids=2...
    const url = new URL(request.url);
    const ids = url.searchParams.getAll('ids');
    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Bulk delete
    await prisma.department.deleteMany({
      where: { id: { in: ids } },
    });

    // Respond 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting departments:', error);
    if (error instanceof NextResponse) throw error;
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}