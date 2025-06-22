'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';
import { Toast } from 'primereact/toast';
import {
  Users,
  UserPlus,
  CheckCircle,
  Clock,
} from 'lucide-react';
import StatisticsCard from '@/components/StatisticsCard';
import DashboardChart from '@/components/DashboardChart';
import NewSupervisor from './supervisors/NewSupervisor';

export default function CoordinatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [newRecord, setNewRecord] = useState(false);

  const [supervisorFilters, setSupervisorFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  // Dialog states
  const [allocationDialog, setAllocationDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

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
      const [supRes, stuRes, projRes, statsRes, sessRes] = await Promise.all([
        fetch('/api/coordinator/supervisors'),
        fetch('/api/coordinator/students'),
        fetch('/api/coordinator/projects'),
        fetch('/api/coordinator/stats'),
        fetch('/api/admin/sessions')
      ]);

      if (supRes.ok) setSupervisors(await supRes.json());
      if (stuRes.ok) setStudents(await stuRes.json());
      if (projRes.ok) setProjects(await projRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (sessRes.ok) setSessions(await sessRes.json());
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const runAllocation = async () => {
    if (!selectedSession) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please select a session for allocation', life: 3000 });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/coordinator/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSession })
      });
      if (res.ok) {
        const result = await res.json();
        toast.current.show({ severity: 'success', summary: 'Success', detail: `${result.allocatedCount} students allocated`, life: 3000 });
        setAllocationDialog(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.current.show({ severity: 'error', summary: 'Error', detail: err.message || 'Allocation failed', life: 3000 });
      }
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'An error occurred during allocation', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const approveProject = async (id) => {
    try {
      const res = await fetch(`/api/coordinator/projects/${id}/approve`, { method: 'PUT' });
      if (res.ok) {
        toast.current.show({ severity: 'success', summary: 'Success', detail: 'Project approved successfully', life: 3000 });
        fetchData();
      } else {
        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to approve project', life: 3000 });
      }
    } catch {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'An error occurred', life: 3000 });
    }
  };

  const rejectProject = async (id) => {
    try {
      const res = await fetch(`/api/coordinator/projects/${id}/reject`, { method: 'PUT' });
      if (res.ok) {
        toast.current.show({ severity: 'success', summary: 'Success', detail: 'Project rejected', life: 3000 });
        fetchData();
      } else {
        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to reject project', life: 3000 });
      }
    } catch {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'An error occurred', life: 3000 });
    }
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

  const projectsChartData = [
    { name: 'Jan', value: 12 }, { name: 'Feb', value: 19 }, { name: 'Mar', value: 15 },
    { name: 'Apr', value: 25 }, { name: 'May', value: 22 }, { name: 'Jun', value: 30 },
    { name: 'Jul', value: 40 }, { name: 'Aug', value: 35 }, { name: 'Sep', value: 20 },
    { name: 'Oct', value: 30 }, { name: 'Nov', value: 28 }, { name: 'Dec', value: 17 }
  ];

  const projectDistribution = [
    { name: 'Approved', value: stats.approvedProjects || 0 },
    { name: 'Pending', value: stats.pendingProjects || 0 },
    { name: 'Rejected', value: (stats.totalProjects || 0) - (stats.approvedProjects || 0) - (stats.pendingProjects || 0) }
  ];

  const statusBodyTemplate = (rowData) => <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />;

  const projectActionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      {rowData.status === 'PENDING' && (
        <>
          <Button icon="pi pi-check" className="p-button-rounded p-button-success p-button-sm" onClick={() => approveProject(rowData.id)} tooltip="Approve" />
          <Button icon="pi pi-times" className="p-button-rounded p-button-danger p-button-sm" onClick={() => rejectProject(rowData.id)} tooltip="Reject" />
        </>
      )}
    </div>
  );

  const statsCards = [
    { title: 'Supervisors', value: stats.totalSupervisors || 0, icon: <Users className="w-5 h-5" />, gradient: 'bg-gradient-to-b from-blue-400 to-blue-600', subtitle: `${stats.newSupervisors || 0} new`, description: 'since last week', trend: { type: stats.supervisorTrend >= 0 ? 'positive' : 'negative', value: `${stats.supervisorTrend || 0}%`, label: 'from last month' } },
    { title: 'Students', value: stats.totalStudents || 0, icon: <UserPlus className="w-5 h-5" />, gradient: 'bg-gradient-to-b from-green-400 to-green-600', subtitle: `${stats.newStudents || 0} new`, description: 'this month', trend: { type: stats.studentTrend >= 0 ? 'positive' : 'negative', value: `${stats.studentTrend || 0}%`, label: 'growth rate' } },
    { title: 'Pending Projects', value: stats.pendingProjects || 0, icon: <Clock className="w-5 h-5" />, gradient: 'bg-gradient-to-b from-orange-400 to-orange-600', subtitle: `${stats.newPending || 0} added`, description: 'in the last 7 days', trend: { type: stats.pendingTrend >= 0 ? 'positive' : 'negative', value: `${stats.pendingTrend || 0}%`, label: 'change' } },
    { title: 'Approved Projects', value: stats.approvedProjects || 0, icon: <CheckCircle className="w-5 h-5" />, gradient: 'bg-gradient-to-b from-purple-400 to-purple-600', subtitle: `${stats.newApproved || 0} approved`, description: 'this week', trend: { type: stats.approvedTrend >= 0 ? 'positive' : 'negative', value: `${stats.approvedTrend || 0}%`, label: 'completion rate' } }
  ];

  if (status === 'loading') return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  return (
    <section className="p-6 space-y-8 bg-gray-100 relative">
      <Toast ref={toast} />
      {newRecord && <NewSupervisor close={() => setNewRecord(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <StatisticsCard {...stat} index={i} />
          </motion.div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button label="Run Allocation" icon="pi pi-refresh" className="bg-green-600 hover:bg-green-700" onClick={() => setAllocationDialog(true)} />
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0">
        <div className="w-2/3">
          <DashboardChart type="bar" data={projectsChartData} title="Monthly Project Submissions" height={300} colors={['#3B82F6']} index={0} />
        </div>
        <div className="w-1/3">
          <DashboardChart type="pie" data={projectDistribution} title="Project Distribution" height={300} colors={['#10B981', '#F59E0B', '#EF4444']} index={1} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Department Supervisors</h2>
            <div className="flex gap-3">
              <Button label="View All" className="p-button-text p-button-sm" onClick={() => router.push('/dashboard/coordinator/supervisors')} />
              <Button icon="pi pi-plus" rounded onClick={() => setNewRecord(true)} />
            </div>
          </div>
          <div className="mb-3 relative">
            <span className="p-input-icon-left block">
              <i className="pi pi-search ml-2" />
              <InputText placeholder="Search supervisors..." className="w-full rounded px-8 py-2 focus:ring-1 focus:ring-cyan-500" onInput={(e) => setSupervisorFilters({ global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS } })} />
            </span>
          </div>
          <DataTable value={supervisors.slice(0, 5)} paginator rows={5} filters={supervisorFilters} filterDisplay="menu" stripedRows scrollable scrollHeight="400px" dataKey="id" loading={loading} className="p-datatable-sm">
            <Column field="name" header="Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="areaOfResearch" header="Research Area" />
            <Column field="maxStudents" header="Max Students" />
          </DataTable>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Department Students</h2>
          <DataTable value={students.slice(0, 5)} paginator rows={5} loading={loading} className="p-datatable-sm">
            <Column field="name" header="Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="areaOfResearch" header="Research Area" />
            <Column field="supervisor" header="Supervisor" />
            <Column field="session.name" header="Session" />
          </DataTable>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Project Topics</h2>
          <DataTable value={projects.slice(0, 5)} paginator rows={5} loading={loading} className="p-datatable-sm">
            <Column field="title" header="Title" sortable />
            <Column field="studentName" header="Student" sortable />
            <Column field="description" header="Description" />
            <Column field="status" header="Status" body={statusBodyTemplate} sortable />
            <Column header="Actions" body={projectActionBodyTemplate} />
          </DataTable>
        </Card>
      </motion.div>

      <Dialog header="Run Student-Supervisor Allocation" visible={allocationDialog} style={{ width: '500px' }} onHide={() => setAllocationDialog(false)}>
        <div className="space-y-4">
          <p>Select the academic session for which you want to run the allocation:</p>
          <div>
            <label className="block text-sm font-medium mb-2">Academic Session</label>
            <Dropdown value={selectedSession} options={sessions.map(s => ({ label: s.name, value: s.id }))} placeholder="Select Session" className="w-full" onChange={(e) => setSelectedSession(e.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button label="Cancel" outlined onClick={() => setAllocationDialog(false)} />
            <Button label="Run Allocation" onClick={runAllocation} loading={loading} disabled={!selectedSession} />
          </div>
        </div>
      </Dialog>
    </section>
  );
}
