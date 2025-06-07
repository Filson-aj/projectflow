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
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Users,
  BookOpen,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Download
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function SupervisorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});

  // Dialog states
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewType, setReviewType] = useState(''); // 'project' or 'submission'

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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

  const onSubmitReview = async (data) => {
    try {
      const endpoint = reviewType === 'project'
        ? `/api/supervisor/projects/${selectedItem.id}/review`
        : `/api/supervisor/submissions/${selectedItem.id}/review`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(`${reviewType} reviewed successfully`);
        setReviewDialog(false);
        reset();
        setSelectedItem(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit review');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const openReviewDialog = (item, type) => {
    setSelectedItem(item);
    setReviewType(type);
    reset({ status: 'APPROVED', feedback: '' });
    setReviewDialog(true);
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

  const projectActionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {rowData.status === 'PENDING' && (
          <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-info p-button-sm"
            onClick={() => openReviewDialog(rowData, 'project')}
            tooltip="Review Project"
          />
        )}
      </div>
    );
  };

  const submissionActionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-download"
          className="p-button-rounded p-button-info p-button-sm"
          onClick={() => window.open(`/api/files/${rowData.fileName}`, '_blank')}
          tooltip="Download File"
        />
        {rowData.status === 'PENDING' && (
          <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-success p-button-sm"
            onClick={() => openReviewDialog(rowData, 'submission')}
            tooltip="Review Submission"
          />
        )}
      </div>
    );
  };

  const statsCards = [
    {
      title: 'My Students',
      value: stats.totalStudents || 0,
      icon: <Users className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects || 0,
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews || 0,
      icon: <Clock className="w-8 h-8" />,
      color: 'bg-orange-500'
    },
    {
      title: 'Completed Projects',
      value: stats.completedProjects || 0,
      icon: <CheckCircle className="w-8 h-8" />,
      color: 'bg-purple-500'
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
            <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
            <p className="text-gray-600">Monitor and guide your students' progress</p>
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
                  </div>
                  <div className={`${stat.color} text-white p-3 rounded-lg`}>
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Students Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">My Students</h2>
            <DataTable
              value={students}
              loading={loading}
              paginator
              rows={10}
              className="p-datatable-sm"
            >
              <Column field="firstName" header="First Name" sortable />
              <Column field="lastName" header="Last Name" sortable />
              <Column field="email" header="Email" sortable />
              <Column field="areaOfResearch" header="Research Area" />
              <Column field="createdAt" header="Joined" sortable />
            </DataTable>
          </Card>
        </motion.div>

        {/* Projects Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Project Topics</h2>
            <DataTable
              value={projects}
              loading={loading}
              paginator
              rows={10}
              className="p-datatable-sm"
            >
              <Column field="title" header="Title" sortable />
              <Column field="student.firstName" header="Student" sortable />
              <Column field="description" header="Description" />
              <Column
                field="status"
                header="Status"
                body={statusBodyTemplate}
                sortable
              />
              <Column field="createdAt" header="Submitted" sortable />
              <Column
                body={projectActionBodyTemplate}
                header="Actions"
                style={{ width: '120px' }}
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
            <h2 className="text-xl font-semibold mb-4">Student Submissions</h2>
            <DataTable
              value={submissions}
              loading={loading}
              paginator
              rows={10}
              className="p-datatable-sm"
            >
              <Column field="title" header="Title" sortable />
              <Column field="student.firstName" header="Student" sortable />
              <Column field="project.title" header="Project" sortable />
              <Column field="fileName" header="File" />
              <Column
                field="status"
                header="Status"
                body={statusBodyTemplate}
                sortable
              />
              <Column field="createdAt" header="Submitted" sortable />
              <Column
                body={submissionActionBodyTemplate}
                header="Actions"
                style={{ width: '150px' }}
              />
            </DataTable>
          </Card>
        </motion.div>

        {/* Review Dialog */}
        <Dialog
          header={`Review ${reviewType === 'project' ? 'Project Topic' : 'Submission'}`}
          visible={reviewDialog}
          style={{ width: '600px' }}
          onHide={() => setReviewDialog(false)}
        >
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold">{selectedItem.title}</h3>
                <p className="text-gray-600 mt-2">{selectedItem.description}</p>
                {reviewType === 'submission' && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">File: {selectedItem.fileName}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Decision</label>
                  <select
                    {...register('status', { required: 'Decision is required' })}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="APPROVED">Approve</option>
                    <option value="REJECTED">Reject</option>
                    {reviewType === 'submission' && (
                      <option value="NEEDS_REVISION">Needs Revision</option>
                    )}
                  </select>
                  {errors.status && <small className="text-red-500">{errors.status.message}</small>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Feedback</label>
                  <InputTextarea
                    {...register('feedback', { required: 'Feedback is required' })}
                    className="w-full"
                    rows={4}
                    placeholder="Provide detailed feedback for the student"
                  />
                  {errors.feedback && <small className="text-red-500">{errors.feedback.message}</small>}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    label="Cancel"
                    outlined
                    onClick={() => setReviewDialog(false)}
                  />
                  <Button
                    type="submit"
                    label="Submit Review"
                  />
                </div>
              </form>
            </div>
          )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}