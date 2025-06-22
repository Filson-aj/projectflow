'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import {
  BookOpen,
  User,
  Upload,
  CheckCircle,
  Target,
} from 'lucide-react';
import StatisticsCard from '@/components/StatisticsCard';
import DashboardChart from '@/components/DashboardChart';
import NewProject from './projects/NewProject';

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [supervisor, setSupervisor] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    approvedProjects: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    projectTrend: 0,
    submissionTrend: 0,
    progressScore: 0,
    distribution: { approved: 0, pending: 0, needsRevision: 0 },
    weeklyProgress: []
  });
  const [newRecord, setNewRecord] = useState(false);

  const [projectFilters, setProjectFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });
  const [submissionFilters, setSubmissionFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/signin');
      return;
    }
    fetchData();
  }, [session, status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, submissionsRes, statsRes] = await Promise.all([
        fetch('/api/student/projects'),
        fetch('/api/student/submissions'),
        fetch('/api/student/stats')
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);

        // Get supervisor info from the first assigned project
        const assignedProject = projectsData.find(p => p.supervisor);
        if (assignedProject) {
          setSupervisor(assignedProject.supervisor);
        }
      }
      if (submissionsRes.ok) setSubmissions(await submissionsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
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
      default: return 'info';
    }
  };

  const statusBodyTemplate = (rowData) => {
    return <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />;
  };

  // Statistics cards data
  const statisticsData = [
    {
      title: 'My Projects',
      value: stats.totalProjects || 0,
      icon: <BookOpen className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
      subtitle: `${stats.totalProjects || 0} total`,
      description: 'projects in progress',
      trend: {
        type: stats.projectTrend >= 0 ? 'positive' : 'negative',
        value: `${stats.projectTrend >= 0 ? '+' : ''}${stats.projectTrend || 0}%`,
        label: 'this week'
      }
    },
    {
      title: 'Approved Projects',
      value: stats.approvedProjects || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-green-400 to-green-600',
      subtitle: `${Math.round((stats.approvedProjects / Math.max(stats.totalProjects, 1)) * 100)}%`,
      description: 'approval rate',
      trend: {
        type: stats.projectTrend >= 0 ? 'positive' : 'negative',
        value: `${stats.projectTrend >= 0 ? '+' : ''}${stats.projectTrend || 0}%`,
        label: 'this week'
      }
    },
    {
      title: 'Submissions',
      value: stats.totalSubmissions || 0,
      icon: <Upload className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-violet-400 to-violet-600',
      subtitle: `${stats.pendingSubmissions || 0} pending`,
      description: 'review submissions',
      trend: {
        type: stats.submissionTrend >= 0 ? 'positive' : 'negative',
        value: `${stats.submissionTrend >= 0 ? '+' : ''}${stats.submissionTrend || 0}%`,
        label: 'this week'
      }
    },
    {
      title: 'Progress Score',
      value: `${stats.progressScore || 0}%`,
      icon: <Target className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-orange-400 to-orange-600',
      subtitle: 'Excellent',
      description: 'performance rating',
      trend: {
        type: stats.progressScore >= 50 ? 'positive' : 'negative',
        value: `${stats.progressScore || 0}%`,
        label: 'approval rate'
      }
    }
  ];

  // Chart data
  const progressData = stats?.weeklyProgress.length > 0 ? stats.weeklyProgress.map(w => ({ name: w.week, value: w.projects + w.submissions })) : [
    { name: 'Week 1', value: 20 },
    { name: 'Week 2', value: 35 },
    { name: 'Week 3', value: 45 },
    { name: 'Week 4', value: 60 },
    { name: 'Week 5', value: 75 },
    { name: 'Week 6', value: 85 }
  ];

  const submissionStatusData = [
    { name: 'Approved', value: stats.distribution.approved || 8 },
    { name: 'Pending', value: stats.distribution.pending || 0 },
    { name: 'Needs Revision', value: stats.distribution.needsRevision || 2 }
  ];

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <section className="p-6 space-y-8 bg-gray-100 relative">
      <Toast ref={toast} />
      {newRecord && (<NewProject close={() => setNewRecord(false)} />)}
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
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0">
        <div className="w-2/3">
          <DashboardChart
            type="line"
            data={progressData}
            title="Academic Progress (Weekly)"
            height={300}
            colors={['#10B981']}
            index={0}
          />
        </div>

        <div className="w-1/3">
          <DashboardChart
            type="pie"
            data={submissionStatusData}
            title="Submission Status Distribution"
            height={300}
            colors={['#10B981', '#F59E0B', '#EF4444']}
            index={1}
          />
        </div>
      </div>

      {/* Supervisor Info */}
      {supervisor && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-0">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-4 rounded-xl">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Your Supervisor</h3>
                <p className="text-gray-700 font-medium">{supervisor.firstName} {supervisor.lastName}</p>
                <p className="text-sm text-gray-600">{supervisor.email}</p>
                <p className="text-sm text-gray-600">{supervisor.phone}</p>
                <p className="text-sm text-gray-600">{supervisor.areaOfResearch}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Projects Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Projects</h2>
            <div className='flex justify-between items-center space-x-3'>
              <Button
                label="View All"
                className="p-button-text p-button-sm"
                onClick={() => router.push('/dashboard/student/projects')}
              />
              <Button
                icon="pi pi-plus"
                className='p-button-rounded p-button-sm'
                onClick={() => setNewRecord(true)}
              />
            </div>
          </div>

          <div className="mb-3 relative">
            <span className="p-input-icon-left block">
              <i className="pi pi-search ml-2" />
              <InputText placeholder="Search projects..." className="w-full rounded px-8 py-2 focus:ring-1 focus:ring-cyan-500" onInput={(e) => setProjectFilters({ global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS } })} />
            </span>
          </div>

          <DataTable
            value={projects.slice(0, 5)}
            loading={loading}
            paginator
            rows={5}
            filters={projectFilters}
            filterDisplay="menu"
            stripedRows
            scrollable
            scrollHeight="400px"
            dataKey="id"
            className="p-datatable-sm"
          >
            <Column field="title" header="Title" />
            <Column field="description" header="Description" />
            <Column field="status" header="Status" body={statusBodyTemplate} />
          </DataTable>
        </Card>
      </motion.div>

      {/* Submissions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold mb-4">Recent Submissions</h2>
            <div className='flex justify-between items-center space-x-3'>
              <Button
                label="View All"
                className="p-button-text p-button-sm"
                onClick={() => router.push('/dashboard/student/submissions')}
              />
            </div>
          </div>

          <div className="mb-3 relative">
            <span className="p-input-icon-left block">
              <i className="pi pi-search ml-2" />
              <InputText placeholder="Search submissions..." className="w-full rounded px-8 py-2 focus:ring-1 focus:ring-cyan-500" onInput={(e) => setSubmissionFilters({ global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS } })} />
            </span>
          </div>

          <DataTable
            value={submissions.slice(0, 5)}
            loading={loading}
            paginator
            rows={5}
            filters={submissionFilters}
            filterDisplay="menu"
            stripedRows
            scrollable
            scrollHeight="400px"
            dataKey="id"
            className="p-datatable-sm"
          >
            <Column field="title" header="Title" />
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