'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { toast } from 'sonner';
import {
  Users,
  Building2,
  BookOpen,
  Award,
} from 'lucide-react';
import StatisticsCard from '@/components/StatisticsCard';
import DashboardChart from '@/components/DashboardChart';
import NewUser from '@/features/Users/NewUser';

export default function AdminDashboard() {
  /* Local state */
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedRows, setSelectedRows] = useState([])
  const [newRecord, setNewRecord] = useState(false)

  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  })

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats')
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        const transformed = data.map((u) => ({
          ...u,
          name: `${u.firstName} ${u.lastName}`,
          department: u.department?.name || "—",
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

  const statisticsData = () => {
    const {
      totalUsers,
      totalDepartments,
      activeProjects,
      completedProjects,
      newUsers,
      newDepartments,
      newActiveProjects,
      newCompletedProjects,
      userTrend,
      deptTrend,
      activeTrend,
      completedTrend
    } = stats || {};
    return [
      {
        title: 'Total Users',
        value: totalUsers || 0,
        icon: <Users className="w-5 h-5" />,
        gradient: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
        subtitle: `${newUsers || 0} new`,
        description: 'this month',
        trend: {
          type: userTrend >= 0 ? 'positive' : 'negative',
          value: `${userTrend >= 0 ? '+' : ''}${userTrend || 0}%`,
          label: 'from last month'
        }
      },
      {
        title: 'Departments',
        value: totalDepartments || 0,
        icon: <Building2 className="w-5 h-5" />,
        gradient: 'bg-gradient-to-b from-orange-400 to-orange-600',
        subtitle: `${newDepartments || 0} new`,
        description: 'this month',
        trend: {
          type: deptTrend >= 0 ? 'positive' : 'negative',
          value: `${deptTrend >= 0 ? '+' : ''}${deptTrend || 0}%`,
          label: 'from last month'
        }
      },
      {
        title: 'Active Projects',
        value: activeProjects || 0,
        icon: <BookOpen className="w-5 h-5" />,
        gradient: 'bg-gradient-to-b from-slate-400 to-slate-600',
        subtitle: `${newActiveProjects || 0} new`,
        description: 'this month',
        trend: {
          type: activeTrend >= 0 ? 'positive' : 'negative',
          value: `${activeTrend >= 0 ? '+' : ''}${activeTrend || 0}%`,
          label: 'from last month'
        }
      },
      {
        title: 'Completed Projects',
        value: completedProjects || 0,
        icon: <Award className="w-5 h-5" />,
        gradient: 'bg-gradient-to-b from-violet-400 to-violet-600',
        subtitle: `${newCompletedProjects || 0} completed`,
        description: 'this month',
        trend: {
          type: completedTrend >= 0 ? 'positive' : 'negative',
          value: `${completedTrend >= 0 ? '+' : ''}${completedTrend || 0}%`,
          label: 'from last month'
        }
      }
    ]
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statisticsData()?.map((stat, index) => (
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
            <Column field="name" header="Name" />
            <Column field="email" header="Email" />
            <Column field="department" header="Department" />
            <Column field="role" header="Role" />
          </DataTable>
        </Card>
      </motion.div>

    </section>
  );
}