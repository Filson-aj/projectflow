'use client';

import { useState, useEffect, useRef, useCallback, } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { OverlayPanel } from 'primereact/overlaypanel';
import {
  Users,
  BookOpen,
  Clock,
  Award,
} from 'lucide-react';
import StatisticsCard from '@/components/StatisticsCard';
import DashboardChart from '@/components/DashboardChart';
import Spinner from '@/components/Spinner/Spinner';

export default function SupervisorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useRef(null);
  const panel = useRef(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [current, setCurrent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});

  const [studentFilters, setStudentFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });
  const [projectFilters, setProjectFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });
  const [submissionFilters, setSubmissionFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

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
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        console.log('Projects response:', data);
        setProjects(data);
      }
      if (submissionsRes.ok) setSubmissions(await submissionsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const approveProject = async (id) => {
    setApproving(true);
    panel.current.hide();
    try {
      const res = await fetch(`/api/supervisor/projects/${id}/approve`, {
        method: 'PUT'
      });
      const data = await res.json();

      if (res.ok) {
        // If the server returned a custom message, use it, otherwise default
        const msg = data.message ?? 'Project approved successfully';
        toast.current.show({
          severity: 'success',
          summary: 'Success',
          detail: msg,
          life: 3000
        });
        fetchData();
      } else {
        // Show the server's error if present, otherwise a generic one
        const err = data.error ?? 'Failed to approve project';
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: err,
          life: 3000
        });
      }
    } catch (e) {
      console.error('Approve error:', e);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: e.message || e.error || e || 'An unexpected error occurred',
        life: 3000
      });
    } finally {
      setApproving(false);
    }
  };


  const rejectProject = async (id) => {
    panel.current.hide();
    setApproving(true);
    try {
      const res = await fetch(`/api/supervisor/projects/${id}/reject`, { method: 'PUT' });
      if (res.ok) {
        toast.current.show({ severity: 'success', summary: 'Success', detail: 'Project rejected', life: 3000 });
        fetchData();
      } else {
        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to reject project', life: 3000 });
      }
    } catch {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'An error occurred', life: 3000 });
    } finally {
      setApproving(false);
    }
  };

  const getStatusSeverity = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      case 'PENDING':
      case 'NEEDS_REVISION':
        return 'warning';
      case 'IN_PROGRESS':
        return 'info';
      default:
        return 'info';
    }
  };

  const statusBodyTemplate = (rowData) => {
    return <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />;
  };

  const actionBody = useCallback(
    (row) => (
      <Button
        icon="pi pi-ellipsis-v"
        className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
        onClick={(e) => {
          setCurrent(row);
          panel.current.toggle(e);
        }}
      />
    ),
    []
  );

  const overlayActions = [
    { label: "Approve", icon: "pi pi-check", action: () => current && approveProject(current.id) },
    { label: "Reject", icon: "pi pi-times", action: () => current && rejectProject(current.id) },
  ];

  // Statistics cards data
  const statisticsData = [
    {
      title: 'My Students',
      value: stats.totalStudents || 0,
      icon: <Users className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
      subtitle: 'allocated',
      description: 'students',
      trend: {
        type: stats.studentTrend >= 0 ? 'positive' : 'negative',
        value: `${stats.studentTrend >= 0 ? '+' : ''}${stats.studentTrend || 0}`,
        label: 'since last month'
      }
    },
    {
      title: 'Active Projects',
      value: stats.totalProjects || 0,
      icon: <BookOpen className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-green-400 to-green-600',
      subtitle: 'ongoing',
      description: 'projects',
      trend: {
        type: stats.projectTrend >= 0 ? 'positive' : 'negative',
        value: `${stats.projectTrend >= 0 ? '+' : ''}${stats.projectTrend || 0}`,
        label: 'since last month'
      }
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingSubmissions || 0,
      icon: <Clock className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-orange-400 to-orange-600',
      subtitle: 'awaiting',
      description: 'your review',
      trend: {
        type: stats.pendingTrend >= 0 ? 'positive' : 'negative',
        value: `${stats.pendingTrend >= 0 ? '+' : ''}${stats.pendingTrend || 0}`,
        label: 'since last month'
      }
    },
    {
      title: 'Completed Projects',
      value: stats.completedProjects || 0,
      icon: <Award className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-violet-400 to-violet-600',
      subtitle: 'finished',
      description: 'successfully',
      trend: {
        type: stats.completedTrend >= 0 ? 'positive' : 'negative',
        value: `${stats.completedTrend >= 0 ? '+' : ''}${stats.completedTrend || 0}`,
        label: 'since last month'
      }
    }
  ];

  // Chart data
  const projectProgressData = [
    { name: 'Week 1', value: 0 },
    { name: 'Week 2', value: 0 },
    { name: 'Week 3', value: 0 },
    { name: 'Week 4', value: 0 },
    { name: 'Week 5', value: 0 },
    { name: 'Week 6', value: 0 }
  ];

  const submissionStatusData = [
    { name: 'Completed', value: (stats.totalProjects - stats.pendingSubmissions) || 0 },
    { name: 'Pending', value: stats.pendingSubmissions || 0 },
    { name: 'Needs Revision', value: stats.newPendingSubmissions || 0 }
  ];

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <section className="p-6 space-y-8 bg-gray-100 relative">
      <Toast ref={toast} />
      {approving && <Spinner visible={approving} onHide={() => setApproving(false)} />}
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
            data={projectProgressData}
            title="Student Progress Overview"
            height={300}
            colors={['#10B981']}
            index={0}
          />
        </div>

        <div className="w-1/3">
          <DashboardChart
            type="pie"
            data={submissionStatusData}
            title="Submission Distribution"
            height={300}
            colors={['#10B981', '#F59E0B', '#EF4444']}
            index={1}
          />
        </div>
      </div>

      {/* Recent Students */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='w-full'
      >
        <Card className="">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Students</h2>
            <Button
              label="View All"
              className="p-button-text p-button-sm"
              onClick={() => router.push('/dashboard/supervisor/students')}
            />
          </div>

          <div className="mb-3 relative">
            <span className="p-input-icon-left block">
              <i className="pi pi-search ml-2" />
              <InputText placeholder="Search students..." className="w-full rounded px-8 py-2 focus:ring-1 focus:ring-cyan-500" onInput={(e) => setStudentFilters({ global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS } })} />
            </span>
          </div>

          <DataTable
            value={students.slice(0, 5)}
            paginator
            rows={5}
            filters={studentFilters}
            filterDisplay="menu"
            stripedRows
            scrollable
            scrollHeight="400px"
            dataKey="id"
            loading={loading}
            className="p-datatable-sm"
          >
            <Column field="name" header="Name" />
            <Column field="email" header="Email" />
            <Column field="phone" header="Phone" />
            <Column field="areaOfResearch" header="Area of Research" />
            <Column field="sessionName" header="Session" />
          </DataTable>
        </Card>
      </motion.div>

      {/* Recent Projects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full"
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

          <div className="mb-3 relative">
            <span className="p-input-icon-left block">
              <i className="pi pi-search ml-2" />
              <InputText placeholder="Search projects..." className="w-full rounded px-8 py-2 focus:ring-1 focus:ring-cyan-500" onInput={(e) => setProjectFilters({ global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS } })} />
            </span>
          </div>

          <DataTable
            value={projects.slice(0, 5)}
            paginator
            rows={5}
            filters={projectFilters}
            filterDisplay="menu"
            stripedRows
            scrollable
            scrollHeight="400px"
            dataKey="id"
            loading={loading}
            className="p-datatable-sm"
          >
            <Column field="title" header="Title" />
            <Column field="studentName" header="Student" />
            <Column field="description" header="Description" />
            <Column field="status" header="Status" body={statusBodyTemplate} />
            <Column header="Actions" body={actionBody} />
          </DataTable>
        </Card>
      </motion.div>

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

          <div className="mb-3 relative">
            <span className="p-input-icon-left block">
              <i className="pi pi-search ml-2" />
              <InputText placeholder="Search submissions..." className="w-full rounded px-8 py-2 focus:ring-1 focus:ring-cyan-500" onInput={(e) => setSubmissionFilters({ global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS } })} />
            </span>
          </div>

          <DataTable
            value={submissions.slice(0, 5)}
            paginator
            rows={5}
            filters={submissionFilters}
            filterDisplay="menu"
            stripedRows
            scrollable
            scrollHeight="400px"
            dataKey="id"
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

      <OverlayPanel ref={panel}>
        <div className="flex flex-col">
          {overlayActions.map(({ label, icon, action }) => {
            // normalize to lowercase for comparison
            const key = label.toLowerCase();

            // pick text & hover colors based on label
            let colorClasses = "text-gray-900 hover:text-blue-600";
            if (key === "approve") {
              colorClasses = "text-green-600 hover:text-green-800";
            } else if (key === "reject") {
              colorClasses = "text-red-600 hover:text-red-800";
            }

            return (
              <Button
                key={label}
                label={label}
                icon={icon}
                className={`
          p-button-text
          ${colorClasses}
          hover:border-none
          hover:shadow-none
          hover:bg-transparent
        `}
                onClick={action}
              />
            );
          })}
        </div>

      </OverlayPanel>
    </section>
  );
}
