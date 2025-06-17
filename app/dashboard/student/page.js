'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  BookOpen,
  User,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Download,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';
import StatisticsCard from '@/components/StatisticsCard';
import DashboardChart from '@/components/DashboardChart';

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [supervisor, setSupervisor] = useState(null);
  const [stats, setStats] = useState({});

  // Dialog states
  const [projectDialog, setProjectDialog] = useState(false);
  const [submissionDialog, setSubmissionDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitProject = async (data) => {
    try {
      const response = await fetch('/api/student/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Project topic submitted successfully');
        setProjectDialog(false);
        reset();
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit project');
      }
    } catch (error) {
      toast.error('An error occurred');
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

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {rowData.status === 'APPROVED' && (
          <Button
            icon="pi pi-upload"
            className="p-button-rounded p-button-info p-button-sm"
            onClick={() => {
              setSelectedProject(rowData);
              setSubmissionDialog(true);
            }}
            tooltip="Upload Submission"
          />
        )}
      </div>
    );
  };

  // Statistics cards data
  const statisticsData = [
    {
      title: 'My Projects',
      value: stats.totalProjects || 0,
      icon: <BookOpen className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
      subtitle: '2 active',
      description: 'projects in progress',
      trend: { type: 'positive', value: '+1', label: 'new this month' }
    },
    {
      title: 'Approved Projects',
      value: stats.approvedProjects || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-green-400 to-green-600',
      subtitle: '100%',
      description: 'approval rate',
      trend: { type: 'positive', value: '+25%', label: 'improvement' }
    },
    {
      title: 'Submissions',
      value: stats.totalSubmissions || 0,
      icon: <Upload className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-violet-400 to-violet-600',
      subtitle: '3 pending',
      description: 'review submissions',
      trend: { type: 'neutral', value: '2', label: 'due this week' }
    },
    {
      title: 'Progress Score',
      value: '85%',
      icon: <Target className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-orange-400 to-orange-600',
      subtitle: 'Excellent',
      description: 'performance rating',
      trend: { type: 'positive', value: '+5%', label: 'this semester' }
    }
  ];

  // Chart data
  const progressData = [
    { name: 'Week 1', value: 20 },
    { name: 'Week 2', value: 35 },
    { name: 'Week 3', value: 45 },
    { name: 'Week 4', value: 60 },
    { name: 'Week 5', value: 75 },
    { name: 'Week 6', value: 85 }
  ];

  const submissionStatusData = [
    { name: 'Approved', value: 8 },
    { name: 'Pending', value: stats.pendingSubmissions || 0 },
    { name: 'Needs Revision', value: 2 }
  ];

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your academic progress and manage projects</p>
        </div>
        <Button
          label="Submit Project Topic"
          icon="pi pi-plus"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setProjectDialog(true)}
        />
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
          data={progressData}
          title="Academic Progress (Weekly)"
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
                <p className="text-sm text-gray-600">{supervisor.areaOfResearch}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Projects and Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Projects</h2>
              <Button
                label="Submit New Topic"
                icon="pi pi-plus"
                size="small"
                onClick={() => setProjectDialog(true)}
              />
            </div>
            <DataTable
              value={projects}
              loading={loading}
              paginator
              rows={5}
              className="p-datatable-sm"
            >
              <Column field="title" header="Title" />
              <Column
                field="status"
                header="Status"
                body={statusBodyTemplate}
              />
              <Column
                body={actionBodyTemplate}
                header="Actions"
                style={{ width: '100px' }}
              />
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
            <h2 className="text-xl font-semibold mb-4">Recent Submissions</h2>
            <DataTable
              value={submissions}
              loading={loading}
              paginator
              rows={5}
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
      </div>

      {/* Project Dialog */}
      <Dialog
        header="Submit Project Topic"
        visible={projectDialog}
        style={{ width: '600px' }}
        onHide={() => setProjectDialog(false)}
      >
        <form onSubmit={handleSubmit(onSubmitProject)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project Title</label>
            <InputText
              {...register('title', { required: 'Title is required' })}
              className="w-full"
              placeholder="Enter project title"
            />
            {errors.title && <small className="text-red-500">{errors.title.message}</small>}
            }
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Project Description</label>
            <InputTextarea
              {...register('description', { required: 'Description is required' })}
              className="w-full"
              rows={5}
              placeholder="Describe your project in detail"
            />
            {errors.description && <small className="text-red-500">{errors.description.message}</small>}
            }
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              label="Cancel"
              outlined
              onClick={() => setProjectDialog(false)}
            />
            <Button
              type="submit"
              label="Submit Topic"
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}