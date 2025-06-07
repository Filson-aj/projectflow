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
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Users,
  Building2,
  BookOpen,
  Award,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  BarChart3
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, usersRes, projectsRes, statsRes] = await Promise.all([
        fetch('/api/admin/departments'),
        fetch('/api/admin/users'),
        fetch('/api/admin/projects'),
        fetch('/api/admin/stats')
      ]);

      if (deptRes.ok) setDepartments(await deptRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitDepartment = async (data) => {
    try {
      const method = selectedDepartment ? 'PUT' : 'POST';
      const url = selectedDepartment
        ? `/api/admin/departments/${selectedDepartment.id}`
        : '/api/admin/departments';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(`Department ${selectedDepartment ? 'updated' : 'created'} successfully`);
        setDepartmentDialog(false);
        reset();
        setSelectedDepartment(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const onSubmitUser = async (data) => {
    try {
      const method = selectedUser ? 'PUT' : 'POST';
      const url = selectedUser
        ? `/api/admin/users/${selectedUser.id}`
        : '/api/admin/users';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(`User ${selectedUser ? 'updated' : 'created'} successfully`);
        setUserDialog(false);
        reset();
        setSelectedUser(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const deleteDepartment = async (department) => {
    if (confirm('Are you sure you want to delete this department?')) {
      try {
        const response = await fetch(`/api/admin/departments/${department.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Department deleted successfully');
          fetchData();
        } else {
          toast.error('Failed to delete department');
        }
      } catch (error) {
        toast.error('An error occurred');
      }
    }
  };

  const deleteUser = async (user) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('User deleted successfully');
          fetchData();
        } else {
          toast.error('Failed to delete user');
        }
      } catch (error) {
        toast.error('An error occurred');
      }
    }
  };

  const openDepartmentDialog = (department = null) => {
    setSelectedDepartment(department);
    if (department) {
      reset(department);
    } else {
      reset({ name: '', code: '', description: '' });
    }
    setDepartmentDialog(true);
  };

  const openUserDialog = (user = null) => {
    setSelectedUser(user);
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        maxStudents: user.maxStudents,
        areaOfResearch: user.areaOfResearch
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        role: 'COORDINATOR',
        password: 'password',
        departmentId: '',
        maxStudents: 5,
        areaOfResearch: ''
      });
    }
    setUserDialog(true);
  };

  const actionBodyTemplate = (rowData, type) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => type === 'department' ? openDepartmentDialog(rowData) : openUserDialog(rowData)}
          tooltip="Edit"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => type === 'department' ? deleteDepartment(rowData) : deleteUser(rowData)}
          tooltip="Delete"
        />
      </div>
    );
  };

  const roleOptions = [
    { label: 'Coordinator', value: 'COORDINATOR' },
    { label: 'Supervisor', value: 'SUPERVISOR' }
  ];

  const departmentOptions = departments.map(dept => ({
    label: dept.name,
    value: dept.id
  }));

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: <Users className="w-8 h-8" />,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Departments',
      value: stats.totalDepartments || 0,
      icon: <Building2 className="w-8 h-8" />,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects || 0,
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-purple-500',
      change: '+18%'
    },
    {
      title: 'Completed Projects',
      value: stats.completedProjects || 0,
      icon: <Award className="w-8 h-8" />,
      color: 'bg-orange-500',
      change: '+25%'
    }
  ];

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your entire system from here</p>
          </div>
          <div className="flex gap-3">
            <Button
              label="Add Department"
              icon="pi pi-plus"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => openDepartmentDialog()}
            />
            <Button
              label="Add User"
              icon="pi pi-plus"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openUserDialog()}
            />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change} from last month</p>
                  </div>
                  <div className={`${stat.color} text-white p-3 rounded-lg`}>
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Departments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Departments</h2>
              <Button
                label="Add Department"
                icon="pi pi-plus"
                size="small"
                onClick={() => openDepartmentDialog()}
              />
            </div>
            <DataTable
              value={departments}
              loading={loading}
              paginator
              rows={10}
              className="p-datatable-sm"
            >
              <Column field="name" header="Name" sortable />
              <Column field="code" header="Code" sortable />
              <Column field="description" header="Description" />
              <Column
                body={(rowData) => actionBodyTemplate(rowData, 'department')}
                header="Actions"
                style={{ width: '120px' }}
              />
            </DataTable>
          </Card>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Users</h2>
              <Button
                label="Add User"
                icon="pi pi-plus"
                size="small"
                onClick={() => openUserDialog()}
              />
            </div>
            <DataTable
              value={users}
              loading={loading}
              paginator
              rows={10}
              className="p-datatable-sm"
            >
              <Column field="firstName" header="First Name" sortable />
              <Column field="lastName" header="Last Name" sortable />
              <Column field="email" header="Email" sortable />
              <Column field="role" header="Role" sortable />
              <Column
                field="department.name"
                header="Department"
                sortable
              />
              <Column
                body={(rowData) => actionBodyTemplate(rowData, 'user')}
                header="Actions"
                style={{ width: '120px' }}
              />
            </DataTable>
          </Card>
        </motion.div>

        {/* Department Dialog */}
        <Dialog
          header={selectedDepartment ? 'Edit Department' : 'Add Department'}
          visible={departmentDialog}
          style={{ width: '450px' }}
          onHide={() => setDepartmentDialog(false)}
        >
          <form onSubmit={handleSubmit(onSubmitDepartment)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <InputText
                {...register('name', { required: 'Name is required' })}
                className="w-full"
                placeholder="Department Name"
              />
              {errors.name && <small className="text-red-500">{errors.name.message}</small>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Code</label>
              <InputText
                {...register('code', { required: 'Code is required' })}
                className="w-full"
                placeholder="Department Code"
              />
              {errors.code && <small className="text-red-500">{errors.code.message}</small>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <InputTextarea
                {...register('description')}
                className="w-full"
                rows={3}
                placeholder="Department Description"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label="Cancel"
                outlined
                onClick={() => setDepartmentDialog(false)}
              />
              <Button
                type="submit"
                label={selectedDepartment ? 'Update' : 'Create'}
              />
            </div>
          </form>
        </Dialog>

        {/* User Dialog */}
        <Dialog
          header={selectedUser ? 'Edit User' : 'Add User'}
          visible={userDialog}
          style={{ width: '600px' }}
          onHide={() => setUserDialog(false)}
        >
          <form onSubmit={handleSubmit(onSubmitUser)} className="space-y-4">
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

            {!selectedUser && (
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: 'Role is required' }}
                  render={({ field }) => (
                    <Dropdown
                      {...field}
                      options={roleOptions}
                      placeholder="Select Role"
                      className="w-full"
                    />
                  )}
                />
                {errors.role && <small className="text-red-500">{errors.role.message}</small>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <Controller
                  name="departmentId"
                  control={control}
                  rules={{ required: 'Department is required' }}
                  render={({ field }) => (
                    <Dropdown
                      {...field}
                      options={departmentOptions}
                      placeholder="Select Department"
                      className="w-full"
                    />
                  )}
                />
                {errors.departmentId && <small className="text-red-500">{errors.departmentId.message}</small>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Area of Research</label>
              <InputTextarea
                {...register('areaOfResearch')}
                className="w-full"
                rows={3}
                placeholder="Area of Research"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Students (for Supervisors)</label>
              <InputText
                {...register('maxStudents')}
                className="w-full"
                placeholder="Maximum number of students"
                type="number"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label="Cancel"
                outlined
                onClick={() => setUserDialog(false)}
              />
              <Button
                type="submit"
                label={selectedUser ? 'Update' : 'Create'}
              />
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}