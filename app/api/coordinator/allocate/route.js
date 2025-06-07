import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Intelligent allocation algorithm
function allocateStudentsToSupervisors(students, supervisors) {
  const allocations = [];
  
  // Create a copy of supervisors with current student count
  const supervisorCapacity = supervisors.map(supervisor => ({
    ...supervisor,
    currentStudents: supervisor._count?.studentProjects || 0,
    availableSlots: supervisor.maxStudents - (supervisor._count?.studentProjects || 0)
  })).filter(s => s.availableSlots > 0);

  // Sort students by research area similarity and registration date
  const sortedStudents = [...students].sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  for (const student of sortedStudents) {
    if (!student.areaOfResearch) continue;

    // Calculate similarity scores with available supervisors
    const supervisorScores = supervisorCapacity
      .filter(s => s.availableSlots > 0)
      .map(supervisor => {
        const similarity = calculateSimilarity(
          student.areaOfResearch.toLowerCase(),
          supervisor.areaOfResearch.toLowerCase()
        );
        
        return {
          supervisor,
          similarity,
          // Prefer supervisors with more available slots for better distribution
          capacityScore: supervisor.availableSlots / supervisor.maxStudents
        };
      })
      .sort((a, b) => {
        // Primary sort by similarity, secondary by capacity
        if (Math.abs(a.similarity - b.similarity) < 0.1) {
          return b.capacityScore - a.capacityScore;
        }
        return b.similarity - a.similarity;
      });

    if (supervisorScores.length > 0) {
      const bestMatch = supervisorScores[0];
      
      allocations.push({
        studentId: student.id,
        supervisorId: bestMatch.supervisor.id,
        similarity: bestMatch.similarity
      });

      // Update supervisor capacity
      const supervisorIndex = supervisorCapacity.findIndex(
        s => s.id === bestMatch.supervisor.id
      );
      if (supervisorIndex !== -1) {
        supervisorCapacity[supervisorIndex].availableSlots--;
      }
    }
  }

  return allocations;
}

function calculateSimilarity(text1, text2) {
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  
  const commonWords = words1.filter(word => 
    words2.some(w2 => w2.includes(word) || word.includes(w2))
  );
  
  return commonWords.length / Math.max(words1.length, words2.length);
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'COORDINATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get coordinator's department
    const coordinator = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { coordinatedDepartment: true }
    });

    if (!coordinator?.coordinatedDepartment) {
      return NextResponse.json({ error: 'Department not found' }, { status: 400 });
    }

    // Get unallocated students in the department
    const unallocatedStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        studentDepartmentId: coordinator.coordinatedDepartment.id,
        studentProjects: {
          none: {
            supervisorId: { not: null }
          }
        }
      }
    });

    // Get available supervisors in the department
    const supervisors = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR',
        supervisorDepartmentId: coordinator.coordinatedDepartment.id
      },
      include: {
        _count: {
          select: {
            supervisedProjects: true
          }
        }
      }
    });

    // Run allocation algorithm
    const allocations = allocateStudentsToSupervisors(unallocatedStudents, supervisors);

    // Apply allocations to approved projects
    let allocatedCount = 0;
    
    for (const allocation of allocations) {
      // Find an approved project for this student
      const approvedProject = await prisma.project.findFirst({
        where: {
          studentId: allocation.studentId,
          status: 'APPROVED',
          supervisorId: null
        }
      });

      if (approvedProject) {
        await prisma.project.update({
          where: { id: approvedProject.id },
          data: {
            supervisorId: allocation.supervisorId,
            status: 'ASSIGNED'
          }
        });
        allocatedCount++;
      }
    }

    return NextResponse.json({
      message: 'Allocation completed successfully',
      allocatedCount,
      totalStudents: unallocatedStudents.length
    });
  } catch (error) {
    console.error('Error running allocation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}