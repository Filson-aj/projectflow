'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { FilterMatchMode } from 'primereact/api';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Users,
  Building2,
  BookOpen,
  Award,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import StatisticsCard from '@/components/StatisticsCard';
import DashboardChart from '@/components/DashboardChart';
import NewUser from '@/features/Users/NewUser';
import EditUser from '@/features/Users/EditUser';

export default function AdminDashboard() {
  /* Local state */
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedRows, setSelectedRows] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [contextMenuRow, setContextMenuRow] = useState(null)
  const [deleteRecord, setDeleteRecord] = useState(false)
  const [newRecord, setNewRecord] = useState(false)
  const [editRecord, setEditRecord] = useState(false)
  const [confirmMultiDelete, setConfirmMultiDelete] = useState(false)

  const menu = useRef(null)
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  })

  // Dialog states
  const [departmentDialog, setDepartmentDialog] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }
    fetchData();
  }, [session, status]);

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

  const confirmDelete = useCallback((ids) => {
    confirmDialog({
      message:
        ids.length === 1
          ? "Do you really want to delete this school?"
          : `Are you sure you want to delete the ${ids.length} selected schools?`,
      header: "Confirm Deletion",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      rejectClassName: "p-button-primary",
      accept: async () => {
        setDeletingIds(ids);
        try {
          const formData = new FormData();
          ids.forEach((id) => formData.append("ids", id));
          const response = await remove(undefined, formData);

          if (response.success) {
            toast.current?.show({
              severity: "success",
              summary: "Deleted",
              detail:
                ids.length === 1
                  ? "School deleted successfully."
                  : `${response.data.count} schools deleted successfully.`,
            });
            setSchools((prev) => prev.filter((s) => !ids.includes(s.id)));
            setSelected((prev) => prev.filter((s) => !ids.includes(s.id)));
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.message || "Failed to delete school(s).",
          });
        } finally {
          setDeletingIds([]);
        }
      },
    });
  }, []);


  //Context menu data
  const contextMenuItems = useMemo(() => {
    return [
      { label: 'Edit', icon: <Edit className='text-blue-500' />, command: () => handleEdit(contextMenuRow?.id) },
      { label: 'Delete', icon: <Trash2 className='text-red-500' />, command: () => handleDelete(contextMenuRow?.id) },
    ]
  }, [contextMenuRow?.id, handleDelete, handleEdit])

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/departments'),
        fetch('/api/admin/users'),
        fetch('/api/admin/stats')
      ]);

      if (deptRes.ok) setDepartments(await deptRes.json());
      if (usersRes.ok) {
        const data = await usersRes.json();
        const transformed = data.map((u) => ({
          ...u,
          name: `${u.firstName} ${u.lastName}`,
        }));
        setUsers(transformed);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Statistics cards data
  const statisticsData = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: <Users className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
      subtitle: '24 new',
      description: 'since last visit',
      trend: { type: 'positive', value: '+12%', label: 'from last month' }
    },
    {
      title: 'Departments',
      value: stats.totalDepartments || 0,
      icon: <Building2 className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-orange-400 to-orange-600',
      subtitle: '2 new',
      description: 'departments added',
      trend: { type: 'positive', value: '+5%', label: 'growth rate' }
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects || 0,
      icon: <BookOpen className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-slate-400 to-slate-600',
      subtitle: '48 new',
      description: 'projects this month',
      trend: { type: 'positive', value: '+18%', label: 'increase' }
    },
    {
      title: 'Completed Projects',
      value: stats.completedProjects || 0,
      icon: <Award className="w-5 h-5" />,
      gradient: 'bg-gradient-to-b from-violet-400 to-violet-600',
      subtitle: '15 completed',
      description: 'this week',
      trend: { type: 'positive', value: '+25%', label: 'completion rate' }
    }
  ];

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

  const departmentDistribution = [
    { name: 'Computer Science', value: 45 },
    { name: 'Engineering', value: 35 },
    { name: 'Mathematics', value: 20 },
    { name: 'Physics', value: 15 }
  ];

  const userGrowthData = [
    { name: 'Week 1', value: 20 },
    { name: 'Week 2', value: 35 },
    { name: 'Week 3', value: 28 },
    { name: 'Week 4', value: 42 }
  ];

  return (
    <section className="p-6 space-y-8 bg-gray-100">
      {newRecord && <NewUser close={() => setNewRecord(false)} />}
      {editRecord && <EditUser id={selectedItem} close={() => setEditRecord(false)} />}

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
            data={departmentDistribution}
            title="Department Distribution"
            height={300}
            colors={['#3B82F6', '#06B6D4', '#8B5CF6', '#F59E0B']}
            index={1}
          />
        </div>
      </div>

      {/* Users growth charts */}
      <div className="w-full flex">
        <DashboardChart
          type="line"
          data={userGrowthData}
          title="User Growth (Weekly)"
          height={300}
          colors={['#10B981']}
          index={2}
        />
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col w-full"
      >

        {/* Users Table */}
        <Card className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Users</h2>
            <div className='flex justify-between items-center space-x-3'>
              <Button
                label="View All"
                className="p-button-text p-button-sm"
                onClick={() => router.push('/dashboard/admin/users')}
              />
              <Button
                icon='pi pi-plus'
                className=""
                rounded
                onClick={() => setNewRecord(true)}
              />
            </div>
          </div>
          <div className='mb-3'>
            <span className='p-input-icon-left block'>
              <i className='pi pi-search ml-2' />
              <InputText
                placeholder='Search users...'
                onInput={(e) => setFilters({
                  global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS }
                })}
                className='w-full rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 px-8 py-2'
              />
            </span>
          </div>
          <DataTable
            value={users.slice(0, 5)}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            stripedRows
            filters={filters}
            filterDisplay='menu'
            scrollable
            scrollHeight='400px'
            dataKey='id'
            selection={selectedRows}
            onSelectionChange={(e) => setSelectedRows(e.value)}
            loading={loading}
            className="p-datatable-sm"
          >
            <Column selectionMode='multiple' headerStyle={{ width: '3em' }} />
            <Column field="name" header="Name" />
            <Column field="role" header="Role" />
            <Column
              body={(rowData) => (
                <div className='relative'>
                  <button
                    className='p-2 bg-transparent border-0 focus:outline-none'
                    onClick={(e) => {
                      setContextMenuRow({ ...rowData })
                      menu.current.toggle(e)
                    }}
                  >
                    <MoreVertical className='text-gray-600' />
                  </button>
                  <OverlayPanel ref={menu} className='bg-white/40 backdrop-blur-2xl'>
                    <div className='flex flex-col space-y-3'>
                      {contextMenuItems.map((item, index) => (
                        <button
                          key={index}
                          className={`bg-transparent border-0 p-2 flex items-center justify-between hover:${item.label === 'Delete'
                            ? 'bg-red-100 text-red-500'
                            : 'bg-gray-100'
                            }`}
                          onClick={(e) => {
                            item.command(e)
                            menu.current.hide()
                          }}
                        >
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                  </OverlayPanel>
                </div>
              )}
              header='Actions'
            />
          </DataTable>
        </Card>
        {/* Multi-delete Button */}
        {selectedRows?.length > 0 && (
          <div className='mt-2 w-full'>
            <button
              onClick={() => setConfirmMultiDelete(true)}
              className='bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300'
            >
              Delete Selected ({selectedRows.length})
            </button>
          </div>
        )}
      </motion.div>

    </section>
  );
}