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
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { FilterMatchMode } from 'primereact/api';
import { useForm, Controller } from 'react-hook-form';
import {
  Upload,
  FileText,
  Download,
  Eye,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import moment from 'moment';

export default function StudentSubmissions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionDialog, setSubmissionDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm();

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
      const [submissionsRes, projectsRes] = await Promise.all([
        fetch('/api/student/submissions'),
        fetch('/api/student/projects')
      ]);

      if (submissionsRes.ok) {
        setSubmissions(await submissionsRes.json());
      }
      
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        // Only show approved projects for submission
        const approvedProjects = projectsData.filter(p => p.status === 'APPROVED');
        setProjects(approvedProjects);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch data'
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSubmission = async (data) => {
    if (!uploadedFile) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a file to upload'
      });
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('projectId', data.projectId);
      formData.append('file', uploadedFile);

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Submission uploaded successfully'
        });
        setSubmissionDialog(false);
        reset();
        setUploadedFile(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to upload submission'
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while uploading'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (submissionId) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Submission deleted successfully'
        });
        fetchData();
      } else {
        const error = await response.json();
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to delete submission'
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while deleting'
      });
    }
  };

  const confirmDelete = (submission) => {
    confirmDialog({
      message: 'Are you sure you want to delete this submission?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => deleteSubmission(submission.id)
    });
  };

  const downloadFile = (submission) => {
    window.open(`/api/files/${submission.filePath}`, '_blank');
  };

  const viewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setViewDialog(true);
  };

  const getStatusSeverity = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'NEEDS_REVISION': return 'warning';
      case 'PENDING': return 'info';
      default: return 'info';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      case 'NEEDS_REVISION': return <AlertCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const statusBodyTemplate = (rowData) => {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon(rowData.status)}
        <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
      </div>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-info p-button-sm"
          onClick={() => viewSubmission(rowData)}
          tooltip="View Details"
        />
        <Button
          icon="pi pi-download"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => downloadFile(rowData)}
          tooltip="Download File"
        />
        {rowData.status === 'PENDING' && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={() => confirmDelete(rowData)}
            tooltip="Delete"
          />
        )}
      </div>
    );
  };

  const dateBodyTemplate = (rowData) => {
    return moment(rowData.createdAt).format('DD MMM YYYY, HH:mm');
  };

  const projectOptions = projects.map(project => ({
    label: project.title,
    value: project.id
  }));

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          <p className="text-gray-600 mt-1">Upload and manage your project submissions</p>
        </div>
        <Button
          label="New Submission"
          icon="pi pi-plus"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setSubmissionDialog(true)}
          disabled={projects.length === 0}
        />
      </motion.div>

      {projects.length === 0 && (
        <Card className="p-6 text-center">
          <div className="text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Approved Projects</h3>
            <p>You need to have an approved project before you can make submissions.</p>
          </div>
        </Card>
      )}

      {/* Submissions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Submission History</h2>
            <div className="flex items-center gap-4">
              <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                  placeholder="Search submissions..."
                  onInput={(e) => setFilters({
                    global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS }
                  })}
                  className="pl-8"
                />
              </span>
            </div>
          </div>

          <DataTable
            value={submissions}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            filters={filters}
            filterDisplay="menu"
            emptyMessage="No submissions found"
            className="p-datatable-sm"
          >
            <Column field="title" header="Title" sortable />
            <Column field="projectTitle" header="Project" sortable />
            <Column field="fileName" header="File" sortable />
            <Column 
              field="status" 
              header="Status" 
              body={statusBodyTemplate}
              sortable 
            />
            <Column 
              field="createdAt" 
              header="Submitted" 
              body={dateBodyTemplate}
              sortable 
            />
            <Column
              body={actionBodyTemplate}
              header="Actions"
              style={{ width: '150px' }}
            />
          </DataTable>
        </Card>
      </motion.div>

      {/* New Submission Dialog */}
      <Dialog
        header="New Submission"
        visible={submissionDialog}
        style={{ width: '600px' }}
        onHide={() => {
          setSubmissionDialog(false);
          reset();
          setUploadedFile(null);
        }}
      >
        <form onSubmit={handleSubmit(onSubmitSubmission)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project *</label>
            <Controller
              name="projectId"
              control={control}
              rules={{ required: 'Please select a project' }}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={projectOptions}
                  placeholder="Select a project"
                  className="w-full"
                />
              )}
            />
            {errors.projectId && (
              <small className="text-red-500">{errors.projectId.message}</small>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Submission Title *</label>
            <InputText
              {...register('title', { required: 'Title is required' })}
              className="w-full"
              placeholder="Enter submission title"
            />
            {errors.title && (
              <small className="text-red-500">{errors.title.message}</small>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <InputTextarea
              {...register('description')}
              className="w-full"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">File *</label>
            <FileUpload
              mode="basic"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              maxFileSize={10000000} // 10MB
              onSelect={(e) => setUploadedFile(e.files[0])}
              onClear={() => setUploadedFile(null)}
              chooseLabel="Choose File"
              className="w-full"
            />
            <small className="text-gray-500">
              Accepted formats: PDF, DOC, DOCX, PPT, PPTX (Max: 10MB)
            </small>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              label="Cancel"
              outlined
              onClick={() => {
                setSubmissionDialog(false);
                reset();
                setUploadedFile(null);
              }}
            />
            <Button
              type="submit"
              label="Upload Submission"
              loading={loading}
              disabled={!uploadedFile}
            />
          </div>
        </form>
      </Dialog>

      {/* View Submission Dialog */}
      <Dialog
        header="Submission Details"
        visible={viewDialog}
        style={{ width: '700px' }}
        onHide={() => setViewDialog(false)}
      >
        {selectedSubmission && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{selectedSubmission.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Project</label>
                <p className="mt-1 text-sm text-gray-900">{selectedSubmission.projectTitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusIcon(selectedSubmission.status)}
                  <Tag 
                    value={selectedSubmission.status} 
                    severity={getStatusSeverity(selectedSubmission.status)} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Submitted</label>
                <p className="mt-1 text-sm text-gray-900">
                  {moment(selectedSubmission.createdAt).format('DD MMM YYYY, HH:mm')}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">File</label>
              <div className="mt-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900">{selectedSubmission.fileName}</span>
                <Button
                  icon="pi pi-download"
                  className="p-button-text p-button-sm"
                  onClick={() => downloadFile(selectedSubmission)}
                  tooltip="Download"
                />
              </div>
            </div>

            {selectedSubmission.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{selectedSubmission.description}</p>
              </div>
            )}

            {selectedSubmission.feedback && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Feedback</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900">{selectedSubmission.feedback}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}