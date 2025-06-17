'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { toast } from 'sonner';
import {
  Users,
  BookOpen,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Award,
  Building2
} from 'lucide-react';
import StatisticsCard from '@/components/StatisticsCard';
import DashboardChart from '@/components/DashboardChart';

export default function SupervisorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'SUPERVISOR') {
      router.push('/auth/signin');
      return;
    }
    fetchData();
  }, [session, status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, projectsRes, submissionsRes, statsRes] = await Promise.all([
        fetch('/api/supervisor/students'),
        fetch('/api/supervisor/projects'),
        fetch('/api/supervisor/submissions'),
        fetch('/api/supervisor/stats')
      ]);

      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (submissionsRes.ok) setSubmissions(await submissionsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusSeverity = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'PENDING': return 'warning';
      case 'IN_PROGRESS': return 'info';
      case 'COMPLETED': return 'success';
      case 'NEEDS_REVISION': return 'warning';
      default: return 'info';
    }
  };

  const statusBodyTemplate = (rowData) => {
    return <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />;
  };

  // Statistics cards data
  const statisticsData = [
    {
      title: 'My Students',
      value: stats.totalStudents || 0,
      icon: <Users className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
      subtitle: 'allocated',
      description: 'students under supervision',
      trend: { type: 'positive', value: '+2', label: 'new this session' }
    },
    {
      title: 'Active Projects',
      value: stats.totalProjects || 0,
      icon: <BookOpen className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-green-400 to-green-600',
      subtitle: 'ongoing',
      description: 'projects in progress',
      trend: { type: 'positive', value: '+15%', label: 'completion rate' }
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingSubmissions || 0,
      icon: <Clock className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-orange-400 to-orange-600',
      subtitle: 'awaiting',
      description: 'your review',
      trend: { type: 'neutral', value: '2 days', label: 'avg review time' }
    },
    {
      title: 'Completed Projects',
      value: stats.completedProjects || 0,
      icon: <Award className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-violet-400 to-violet-600',
      subtitle: 'finished',
      description: 'successfully completed',
      trend: { type: 'positive', value: '+25%', label: 'success rate' }
    }
  ];

  // Chart data
  const projectProgressData = [
    { name: 'Week 1', value: 10 },
    { name: 'Week 2', value: 25 },
    { name: 'Week 3', value: 40 },
    { name: 'Week 4', value: 60 },
    { name: 'Week 5', value: 75 },
    { name: 'Week 6', value: 85 }
  ];

  const submissionStatusData = [
    { name: 'Approved', value: stats.totalProjects - stats.pendingSubmissions || 0 },
    { name: 'Pending', value: stats.pendingSubmissions || 0 },
    { name: 'Needs Revision', value: 2 }
  ];

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <section className="p-6 space-y-8 bg-gray-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your students and review their progress</p>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statisticsData.map((stat, index) => (
          <StatisticsCard
            key={index}
            {...stat}
            index={index}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChart
          type="line"
          data={projectProgressData}
          title="Student Progress Overview"
          height={300}
          colors={['#10B981']}
          index={0}
        />

        <DashboardChart
          type="pie"
          data={submissionStatusData}
          title="Submission Status Distribution"
          height={300}
          colors={['#10B981', '#F59E0B', '#EF4444']}
          index={1}
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Students</h2>
              <Button
                label="View All"
                className="p-button-text p-button-sm"
                onClick={() => router.push('/dashboard/supervisor/students')}
              />
            </div>
            <DataTable
              value={students.slice(0, 5)}
              loading={loading}
              className="p-datatable-sm"
            >
              <Column field="name" header="Name" />
              <Column field="email" header="Email" />
              <Column field="sessionName" header="Session" />
            </DataTable>
          </Card>
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Projects</h2>
              <Button
                label="View All"
                className="p-button-text p-button-sm"
                onClick={() => router.push('/dashboard/supervisor/projects')}
              />
            </div>
            <DataTable
              value={projects.slice(0, 5)}
              loading={loading}
              className="p-datatable-sm"
            >
              <Column field="title" header="Title" />
              <Column field="studentName" header="Student" />
              <Column
                field="status"
                header="Status"
                body={statusBodyTemplate}
              />
            </DataTable>
          </Card>
        </motion.div>
      </div>

      {/* Submissions Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Submissions</h2>
            <Button
              label="View All"
              className="p-button-text p-button-sm"
              onClick={() => router.push('/dashboard/supervisor/submissions')}
            />
          </div>
          <DataTable
            value={submissions.slice(0, 5)}
            loading={loading}
            className="p-datatable-sm"
          >
            <Column field="title" header="Title" />
            <Column field="studentName" header="Student" />
            <Column field="projectTitle" header="Project" />
            <Column
              field="status"
              header="Status"
              body={statusBodyTemplate}
            />
            <Column field="createdAt" header="Submitted" />
          </DataTable>
        </Card>
      </motion.div>
    </section>
  );
}