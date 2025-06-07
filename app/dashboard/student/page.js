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
import { FileUpload } from 'primereact/fileupload';
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
  Download
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

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
      const [projectsRes, submissionsRes, supervisorRes, statsRes] = await Promise.all([
        fetch('/api/student/projects'),
        fetch('/api/student/submissions'),
        fetch('/api/student/supervisor'),
        fetch('/api/student/stats')
      ]);

      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (submissionsRes.ok) setSubmissions(await submissionsRes.json());
      if (supervisorRes.ok) setSupervisor(await supervisorRes.json());
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

  const onSubmitSubmission = async (data) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('projectId', selectedProject.id);
      
      if (data.file && data.file[0]) {
        formData.append('file', data.file[0]);
      }

      const response = await fetch('/api/student/submissions', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Submission uploaded successfully');
        setSubmissionDialog(false);
        reset();
        setSelectedProject(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to upload submission');
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

  const downloadBodyTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-download"
        className="p-button-rounded p-button-info p-button-sm"
        onClick={() => window.open(`/api/files/${rowData.fileName}`, '_blank')}
        tooltip="Download File"
      />
    );
  };

  const statsCards = [
    {
      title: 'My Projects',
      value: stats.totalProjects || 0,
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Approved Projects',
      value: stats.approvedProjects || 0,
      icon: <CheckCircle className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      title: 'Submissions',
      value: stats.totalSubmissions || 0,
      icon: <Upload className="w-8 h-8" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingSubmissions || 0,
      icon: <Clock className="w-8 h-8" />,
      color: 'bg-orange-500'
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
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600">Manage your projects and submissions</p>
          </div>
          <Button
            label="Submit Project Topic"
            icon="pi pi-plus"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setProjectDialog(true)}
          />
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

        {/* Supervisor Info */}
        {supervisor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600 text-white p-3 rounded-lg">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Your Supervisor</h3>
                  <p className="text-gray-600">{supervisor.firstName} {supervisor.lastName}</p>
                  <p className="text-sm text-gray-500">{supervisor.email}</p>
                  <p className="text-sm text-gray-500">{supervisor.areaOfResearch}</p>
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
              rows={10}
              className="p-datatable-sm"
            >
              <Column field="title" header="Title" sortable />
              <Column field="description" header="Description" />
              <Column
                field="status"
                header="Status"
                body={statusBodyTemplate}
                sortable
              />
              <Column field="createdAt" header="Submitted" sortable />
              <Column
                body={actionBodyTemplate}
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
            <h2 className="text-xl font-semibold mb-4">My Submissions</h2>
            <DataTable
              value={submissions}
              loading={loading}
              paginator
              rows={10}
              className="p-datatable-sm"
            >
              <Column field="title" header="Title" sortable />
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
                body={downloadBodyTemplate}
                header="Download"
                style={{ width: '100px' }}
              />
            </DataTable>
          </Card>
        </motion.div>

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

        {/* Submission Dialog */}
        <Dialog
          header="Upload Project Submission"
          visible={submissionDialog}
          style={{ width: '600px' }}
          onHide={() => setSubmissionDialog(false)}
        >
          <form onSubmit={handleSubmit(onSubmitSubmission)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Submission Title</label>
              <InputText
                {...register('title', { required: 'Title is required' })}
                className="w-full"
                placeholder="Enter submission title"
              />
              {errors.title && <small className="text-red-500">{errors.title.message}</small>}
              }
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <InputTextarea
                {...register('description')}
                className="w-full"
                rows={3}
                placeholder="Brief description of this submission"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Upload File</label>
              <input
                type="file"
                {...register('file', { required: 'File is required' })}
                className="w-full p-2 border border-gray-300 rounded"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
              />
              {errors.file && <small className="text-red-500">{errors.file.message}</small>}
              }
              <small className="text-gray-500">Supported formats: PDF, DOC, DOCX, PPT, PPTX</small>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                label="Cancel"
                outlined
                onClick={() => setSubmissionDialog(false)}
              />
              <Button
                type="submit"
                label="Upload Submission"
              />
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}