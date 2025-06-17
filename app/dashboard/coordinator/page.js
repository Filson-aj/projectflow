'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useForm, Controller } from 'react-hook-form';
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
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import StatisticsCard from '@/components/StatisticsCard';
import DashboardChart from '@/components/DashboardChart';

export default function CoordinatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [editRecord, setEditRecord] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState(false)

  const [selectedRows, setSelectedRows] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [contextMenuRow, setContextMenuRow] = useState(null)
  const [supervisorFilters, setSupervisorFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  })
  const menu = useRef(null)

  // Dialog states
  const [supervisorDialog, setSupervisorDialog] = useState(false);
  const [allocationDialog, setAllocationDialog] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm();

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
      const [supervisorsRes, studentsRes, projectsRes, statsRes, sessionsRes] = await Promise.all([
        fetch('/api/coordinator/supervisors'),
        fetch('/api/coordinator/students'),
        fetch('/api/coordinator/projects'),
        fetch('/api/coordinator/stats'),
        fetch('/api/sessions')
      ]);

      if (supervisorsRes.ok) setSupervisors(await supervisorsRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (sessionsRes.ok) setSessions(await sessionsRes.json());
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Helper functions
  // ------------------------------
  //Function to handle edit record selection
  const handleEdit = useCallback(id => {
    setSelectedItem(id)
    setEditRecord(true)
  }, [])

  //Function to delect record selection
  const handleDelete = useCallback(id => {
    setSelectedItem(id)
    setDeleteRecord(true)
  }, [])

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
    if (!selectedSession) {
      toast.error('Please select a session for allocation');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/coordinator/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSession })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Allocation completed! ${result.allocatedCount} students allocated`);
        setAllocationDialog(false);
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

  // Chart data
  const projectsChartData = [
    { name: 'Jan', value: 12 },
    { name: 'Feb', value: 19 },
    { name: 'Mar', value: 15 },
    { name: 'Apr', value: 25 },
    { name: 'May', value: 22 },
    { name: 'Jun', value: 30 },
    { name: 'Jul', value: 40 },
    { name: 'Aug', value: 35 },
    { name: 'Sep', value: 20 },
    { name: 'Oct', value: 30 },
    { name: 'Nov', value: 28 },
    { name: 'Dec', value: 17 }
  ];

  const projectDistribution = [
    { name: 'Approved', value: stats.approvedProjects || 0 },
    { name: 'Pending', value: stats.pendingProjects || 0 },
    { name: 'Rejected', value: (stats.totalProjects || 0) - (stats.approvedProjects || 0) - (stats.pendingProjects || 0) },
  ];

  const statusBodyTemplate = (rowData) => {
    return <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />;
  };

  //Context menu data
  const contextMenuItems = useMemo(() => {
    return [
      { label: 'Edit', icon: <Edit className='text-blue-500' />, command: () => handleEdit(contextMenuRow?.id) },
      { label: 'Delete', icon: <Trash2 className='text-red-500' />, command: () => handleDelete(contextMenuRow?.id) },
    ]
  }, [contextMenuRow?.id, handleDelete, handleEdit])

  const supervisorActionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => openSupervisorDialog(rowData)}
          tooltip="Edit"
        />
      </div>
    );
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

  const statsCards = [
    {
      title: 'Supervisors',
      value: stats.totalSupervisors || 0,
      icon: <Users className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-blue-400 to-blue-600',
      subtitle: `${stats.newSupervisors || 0} new`,
      description: 'since last week',
      trend: { type: stats.supervisorTrend >= 0 ? 'positive' : 'negative', value: `${stats.supervisorTrend || 0}%`, label: 'from last month' }
    },
    {
      title: 'Students',
      value: stats.totalStudents || 0,
      icon: <UserPlus className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-green-400 to-green-600',
      subtitle: `${stats.newStudents || 0} new`,
      description: 'this month',
      trend: { type: stats.studentTrend >= 0 ? 'positive' : 'negative', value: `${stats.studentTrend || 0}%`, label: 'growth rate' }
    },
    {
      title: 'Pending Projects',
      value: stats.pendingProjects || 0,
      icon: <Clock className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-orange-400 to-orange-600',
      subtitle: `${stats.newPending || 0} added`,
      description: 'in the last 7 days',
      trend: { type: stats.pendingTrend >= 0 ? 'positive' : 'negative', value: `${stats.pendingTrend || 0}%`, label: 'change' }
    },
    {
      title: 'Approved Projects',
      value: stats.approvedProjects || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-purple-400 to-purple-600',
      subtitle: `${stats.newApproved || 0} approved`,
      description: 'this week',
      trend: { type: stats.approvedTrend >= 0 ? 'positive' : 'negative', value: `${stats.approvedTrend || 0}%`, label: 'completion rate' }
    }
  ];

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <section className="p-6 space-y-8 bg-gray-100">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatisticsCard
              key={index}
              {...stat}
              index={index}
            />
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
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
          onClick={() => setAllocationDialog(true)}
        />
      </div>

      {/* Charts Section */}
      <div className="flex flex-col sm:flex-row space-y-4 space-x-0 sm:space-x-4 sm:space-y-0">
        <div className='w-2/3'>
          <DashboardChart
            type="bar"
            data={projectsChartData}
            title="Monthly Project Submissions"
            height={300}
            colors={['#3B82F6']}
            index={0}
          />
        </div>

        <div className='w-1/3'>
          <DashboardChart
            type="pie"
            data={projectDistribution}
            title="Project Distribution"
            height={300}
            colors={['#10B981', '#F59E0B', '#EF4444']}
            index={1}
          />
        </div>
      </div>

      {/* Supervisors Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='flex flex-col w-full'
      >
        <Card className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Department Supervisors</h2>
            <div className='flex justify-between items-center space-x-3'>
              <Button
                label="View All"
                className='p-button-text p-button-sm'
                onClick={() => router.push('/dashboard/coordinator/supervisors')}
              />
              <Button
                icon='pi pi-plus'
                className=""
                rounded
                onClick={() => openSupervisorDialog()}
              />
            </div>
          </div>

          <div className='mb-3'>
            <span className='p-input-icon-left block'>
              <i className='pi pi-search ml-2' />
              <InputText
                placeholder='Search supervisors...'
                onInput={(e) => setSupervisorFilters({
                  global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS }
                })}
                className='w-full rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 px-8 py-2'
              />
            </span>
          </div>

          <DataTable
            value={supervisors.slice(0, 5)}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            stripedRows
            filters={supervisorFilters}
            filterDisplay='menu'
            scrollable
            scrollHeight='400px'
            dataKey='id'
            loading={loading}
            className="p-datatable-sm"
          >
            <Column field="name" header="Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="areaOfResearch" header="Research Area" />
            <Column field="maxStudents" header="Max Students" />
            <Column
              body={supervisorActionBodyTemplate}
              header='Actions'
            />
          </DataTable>
        </Card>
      </motion.div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Department Students</h2>
          <DataTable
            value={students.slice(0, 5)}
            loading={loading}
            paginator
            rows={5}
            className="p-datatable-sm"
          >
            <Column field="name" header="Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="areaOfResearch" header="Research Area" />
            <Column field="supervisor" header="Supervisor" />
            <Column field="session.name" header="Session" />
          </DataTable>
        </Card>
      </motion.div>

      {/* Projects Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Project Topics</h2>
          <DataTable
            value={projects.slice(0, 5)}
            loading={loading}
            paginator
            rows={5}
            className="p-datatable-sm"
          >
            <Column field="title" header="Title" sortable />
            <Column field="studentName" header="Student" sortable />
            <Column field="description" header="Description" />
            <Column
              field="status"
              header="Status"
              body={statusBodyTemplate}
              sortable
            />
            <Column
              body={projectActionBodyTemplate}
              header="Actions"
              style={{ width: '120px' }}
            />
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
              }
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <InputText
                {...register('lastName', { required: 'Last name is required' })}
                className="w-full"
                placeholder="Last Name"
              />
              {errors.lastName && <small className="text-red-500">{errors.lastName.message}</small>}
              }
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
            }
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
              }
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
            }
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
            }
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

      {/* Allocation Dialog */}
      <Dialog
        header="Run Student-Supervisor Allocation"
        visible={allocationDialog}
        style={{ width: '500px' }}
        onHide={() => setAllocationDialog(false)}
      >
        <div className="space-y-4">
          <p>Select the academic session for which you want to run the allocation:</p>
          
          <div>
            <label className="block text-sm font-medium mb-2">Academic Session</label>
            <Dropdown
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.value)}
              options={sessions.map(session => ({ label: session.name, value: session.id }))}
              placeholder="Select Session"
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              label="Cancel"
              outlined
              onClick={() => setAllocationDialog(false)}
            />
            <Button
              label="Run Allocation"
              onClick={runAllocation}
              loading={loading}
              disabled={!selectedSession}
            />
          </div>
        </div>
      </Dialog>
    </section>
  );
}