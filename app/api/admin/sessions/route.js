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

// GET: fetch all sessions
export async function GET(_request) {
    try {
        /*  const session = await requireAdmin();
         if (!session) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
         } */

        const sessions = await prisma.session.findMany({ orderBy: { createdAt: 'desc' } });
        return NextResponse.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: create a new session (ADMIN only)
export async function POST(request) {
    try {
        await requireAdmin();

        const body = await request.json();
        const { name, startDate, endDate, isActive } = body;
        if (!name || !startDate || !endDate) {
            return NextResponse.json({ error: 'Name, start date, and end date are required' }, { status: 400 });
        }

        // Deactivate other sessions if setting new as active
        if (isActive) {
            await prisma.session?.updateMany({ where: { isActive: true }, data: { isActive: false } });
        }

        const newSession = await prisma.session?.create({
            data: { name, startDate: new Date(startDate), endDate: new Date(endDate), isActive: isActive || false }
        });

        return NextResponse.json(newSession);
    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: update an existing session (ADMIN only)
export async function PUT(request) {
    try {
        await requireAdmin();

        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const updateData = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
        if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
        if (body.isActive !== undefined) {
            // if activating this session, deactivate others
            if (body.isActive) {
                await prisma.session.updateMany({ where: { isActive: true }, data: { isActive: false } });
            }
            updateData.isActive = body.isActive;
        }

        const updated = await prisma.session.update({ where: { id }, data: updateData });
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: delete session(s) (ADMIN only);
// if an active session is deleted, activate the next most recently created session
export async function DELETE(request) {
    try {
        await requireAdmin();

        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');
        if (!ids.length) {
            return NextResponse.json({ error: 'Session IDs are required' }, { status: 400 });
        }

        // Check if deleting the active session
        const activeToDelete = await prisma.session.findFirst({ where: { id: { in: ids }, isActive: true } });

        // Perform deletion
        await prisma.session.deleteMany({ where: { id: { in: ids } } });

        // If the active session was deleted, activate the next most recent session
        if (activeToDelete) {
            const nextSession = await prisma.session.findFirst({ orderBy: { createdAt: 'desc' } });
            if (nextSession) {
                await prisma.session.update({ where: { id: nextSession.id }, data: { isActive: true } });
            }
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting session(s):', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
