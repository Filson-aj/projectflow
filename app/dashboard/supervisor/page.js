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
import { Password } from 'primereact/password';
import { Tag } from 'primereact/tag';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Users,
  BookOpen,
  UserPlus,
  Settings,
  CheckCircle,
  Clock,
  XCircle,
  Shuffle,
  TrendingUp,
  Target,
  Award,
  Building2
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatisticsCard from '@/components/StatisticsCard';
import DashboardChart from '@/components/DashboardChart';

export default function CoordinatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});

  // Dialog states
  const [supervisorDialog, setSupervisorDialog] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'COORDINATOR') {
      router.push('/auth/signin');
      return;
    }
    fetchData();
  }, [session, status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [supervisorsRes, studentsRes, projectsRes, statsRes] = await Promise.all([
        fetch('/api/coordinator/supervisors'),
        fetch('/api/coordinator/students'),
        fetch('/api/coordinator/projects'),
        fetch('/api/coordinator/stats')
      ]);

      if (supervisorsRes.ok) setSupervisors(await supervisorsRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSupervisor = async (data) => {
    try {
      const method = selectedSupervisor ? 'PUT' : 'POST';
      const url = selectedSupervisor
        ? `/api/coordinator/supervisors/${selectedSupervisor.id}`
        : '/api/coordinator/supervisors';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(`Supervisor ${selectedSupervisor ? 'updated' : 'created'} successfully`);
        setSupervisorDialog(false);
        reset();
        setSelectedSupervisor(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const runAllocation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coordinator/allocate', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Allocation completed! ${result.allocatedCount} students allocated`);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Allocation failed');
      }
    } catch (error) {
      toast.error('An error occurred during allocation');
    } finally {
      setLoading(false);
    }
  };

  const approveProject = async (projectId) => {
    try {
      const response = await fetch(`/api/coordinator/projects/${projectId}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Project approved successfully');
        fetchData();
      } else {
        toast.error('Failed to approve project');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const rejectProject = async (projectId) => {
    try {
      const response = await fetch(`/api/coordinator/projects/${projectId}/reject`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Project rejected');
        fetchData();
      } else {
        toast.error('Failed to reject project');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const openSupervisorDialog = (supervisor = null) => {
    setSelectedSupervisor(supervisor);
    if (supervisor) {
      reset({
        firstName: supervisor.firstName,
        lastName: supervisor.lastName,
        email: supervisor.email,
        areaOfResearch: supervisor.areaOfResearch,
        maxStudents: supervisor.maxStudents
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: 'password',
        areaOfResearch: '',
        maxStudents: 5
      });
    }
    setSupervisorDialog(true);
  };

  const getStatusSeverity = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'PENDING': return 'warning';
      case 'ASSIGNED': return 'info';
      default: return 'info';
    }
  };

  const statusBodyTemplate = (rowData) => {
    return <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />;
  };

  const projectActionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {rowData.status === 'PENDING' && (
          <>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-success p-button-sm"
              onClick={() => approveProject(rowData.id)}
              tooltip="Approve"
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              onClick={() => rejectProject(rowData.id)}
              tooltip="Reject"
            />
          </>
        )}
      </div>
    );
  };

  // Statistics cards data
  const statisticsData = [
    {
      title: 'Department Supervisors',
      value: stats.totalSupervisors || 0,
      icon: <Users className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
      subtitle: '2 new',
      description: 'supervisors added',
      trend: { type: 'positive', value: '+15%', label: 'capacity increase' }
    },
    {
      title: 'Department Students',
      value: stats.totalStudents || 0,
      icon: <UserPlus className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-green-400 to-green-600',
      subtitle: '25 active',
      description: 'enrolled students',
      trend: { type: 'positive', value: '+8%', label: 'enrollment growth' }
    },
    {
      title: 'Pending Projects',
      value: stats.pendingProjects || 0,
      icon: <Clock className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-orange-400 to-orange-600',
      subtitle: '5 urgent',
      description: 'need approval',
      trend: { type: 'neutral', value: '2 days', label: 'avg review time' }
    },
    {
      title: 'Department Rating',
      value: '4.8/5',
      icon: <Award className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-violet-400 to-violet-600',
      subtitle: 'Excellent',
      description: 'performance score',
      trend: { type: 'positive', value: '+0.3', label: 'improvement' }
    }
  ];

  // Chart data
  const projectTrendsData = [
    { name: 'Jan', value: 8 },
    { name: 'Feb', value: 12 },
    { name: 'Mar', value: 15 },
    { name: 'Apr', value: 18 },
    { name: 'May', value: 22 },
    { name: 'Jun', value: 25 }
  ];

  const supervisorWorkloadData = [
    { name: 'Dr. Smith', value: 5 },
    { name: 'Dr. Johnson', value: 4 },
    { name: 'Dr. Brown', value: 3 },
    { name: 'Dr. Davis', value: 5 },
    { name: 'Dr. Wilson', value: 2 }
  ];

  const projectStatusData = [
    { name: 'Approved', value: 45 },
    { name: 'Pending', value: 12 },
    { name: 'In Progress', value: 28 },
    { name: 'Completed', value: 15 }
  ];

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coordinator Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your department's academic excellence</p>
          </div>
          <div className="flex gap-3">
            <Button
              label="Add Supervisor"
              icon="pi pi-plus"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => openSupervisorDialog()}
            />
            <Button
              label="Run Allocation"
              icon="pi pi-refresh"
              className="bg-green-600 hover:bg-green-700"
              onClick={runAllocation}
              loading={loading}
            />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <DashboardChart
            type="line"
            data={projectTrendsData}
            title="Project Submission Trends"
            height={300}
            colors={['#3B82F6']}
            index={0}
          />

          <DashboardChart
            type="bar"
            data={supervisorWorkloadData}
            title="Supervisor Workload"
            height={300}
            colors={['#10B981']}
            index={1}
          />

          <DashboardChart
            type="pie"
            data={projectStatusData}
            title="Project Status Overview"
            height={300}
            colors={['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6']}
            index={2}
          />
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supervisors Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Department Supervisors</h2>
                <Button
                  label="Add Supervisor"
                  icon="pi pi-plus"
                  size="small"
                  onClick={() => openSupervisorDialog()}
                />
              </div>
              <DataTable
                value={supervisors}
                loading={loading}
                paginator
                rows={5}
                className="p-datatable-sm"
              >
                <Column field="firstName" header="Name" />
                <Column field="email" header="Email" />
                <Column field="maxStudents" header="Capacity" />
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
              <h2 className="text-xl font-semibold mb-4">Recent Project Topics</h2>
              <DataTable
                value={projects.slice(0, 5)}
                loading={loading}
                className="p-datatable-sm"
              >
                <Column field="title" header="Title" />
                <Column
                  field="status"
                  header="Status"
                  body={statusBodyTemplate}
                />
                <Column
                  body={projectActionBodyTemplate}
                  header="Actions"
                  style={{ width: '120px' }}
                />
              </DataTable>
            </Card>
          </motion.div>
        </div>

        {/* Students Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Department Students</h2>
            <DataTable
              value={students}
              loading={loading}
              paginator
              rows={10}
              className="p-datatable-sm"
            >
              <Column field="firstName" header="Name" />
              <Column field="email" header="Email" />
              <Column field="areaOfResearch" header="Research Area" />
              <Column field="supervisor.firstName" header="Supervisor" />
              <Column field="createdAt" header="Enrolled" />
            </DataTable>
          </Card>
        </motion.div>

        {/* Supervisor Dialog */}
        <Dialog
          header={selectedSupervisor ? 'Edit Supervisor' : 'Add Supervisor'}
          visible={supervisorDialog}
          style={{ width: '600px' }}
          onHide={() => setSupervisorDialog(false)}
        >
          <form onSubmit={handleSubmit(onSubmitSupervisor)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <InputText
                  {...register('firstName', { required: 'First name is required' })}
                  className="w-full"
                  placeholder="First Name"
                />
                {errors.firstName && <small className="text-red-500">{errors.firstName.message}</small>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <InputText
                  {...register('lastName', { required: 'Last name is required' })}
                  className="w-full"
                  placeholder="Last Name"
                />
                {errors.lastName && <small className="text-red-500">{errors.lastName.message}</small>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <InputText
                {...register('email', { required: 'Email is required' })}
                className="w-full"
                placeholder="Email Address"
                type="email"
              />
              {errors.email && <small className="text-red-500">{errors.email.message}</small>}
            </div>

            {!selectedSupervisor && (
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Password
                  {...register('password', { required: 'Password is required' })}
                  className="w-full"
                  placeholder="Password"
                  feedback={false}
                  toggleMask
                />
                {errors.password && <small className="text-red-500">{errors.password.message}</small>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Area of Research</label>
              <InputTextarea
                {...register('areaOfResearch', { required: 'Area of research is required' })}
                className="w-full"
                rows={3}
                placeholder="Area of Research"
              />
              {errors.areaOfResearch && <small className="text-red-500">{errors.areaOfResearch.message}</small>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Maximum Students</label>
              <InputText
                {...register('maxStudents', { required: 'Max students is required' })}
                className="w-full"
                placeholder="Maximum number of students"
                type="number"
              />
              {errors.maxStudents && <small className="text-red-500">{errors.maxStudents.message}</small>}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label="Cancel"
                outlined
                onClick={() => setSupervisorDialog(false)}
              />
              <Button
                type="submit"
                label={selectedSupervisor ? 'Update' : 'Create'}
              />
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}