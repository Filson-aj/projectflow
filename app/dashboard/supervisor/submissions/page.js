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
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { FilterMatchMode } from 'primereact/api';
import { useForm, Controller } from 'react-hook-form';
import {
  FileText,
  Download,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User
} from 'lucide-react';
import moment from 'moment';

export default function SupervisorSubmissions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'SUPERVISOR') {
      router.push('/auth/signin');
      return;
    }
    fetchSubmissions();
  }, [session, status]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supervisor/submissions');
      
      if (response.ok) {
        setSubmissions(await response.json());
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch submissions'
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitReview = async (data) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/submissions/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Review submitted successfully'
        });
        setReviewDialog(false);
        reset();
        fetchSubmissions();
      } else {
        const error = await response.json();
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to submit review'
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while submitting review'
      });
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (submission) => {
    setSelectedSubmission(submission);
    reset({
      status: submission.status,
      feedback: submission.feedback || ''
    });
    setReviewDialog(true);
  };

  const viewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setViewDialog(true);
  };

  const downloadFile = (submission) => {
    window.open(`/api/files/${submission.filePath}`, '_blank');
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
        <Button
          icon="pi pi-comment"
          className="p-button-rounded p-button-warning p-button-sm"
          onClick={() => openReviewDialog(rowData)}
          tooltip="Review"
        />
      </div>
    );
  };

  const dateBodyTemplate = (rowData) => {
    return moment(rowData.createdAt).format('DD MMM YYYY, HH:mm');
  };

  const statusOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Needs Revision', value: 'NEEDS_REVISION' },
    { label: 'Rejected', value: 'REJECTED' }
  ];

  const pendingCount = submissions.filter(s => s.status === 'PENDING').length;
  const approvedCount = submissions.filter(s => s.status === 'APPROVED').length;
  const needsRevisionCount = submissions.filter(s => s.status === 'NEEDS_REVISION').length;

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Toast ref={toast} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Submissions</h1>
          <p className="text-gray-600 mt-1">Review and provide feedback on student submissions</p>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Submissions</p>
              <p className="text-2xl font-bold text-blue-900">{submissions.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Pending Review</p>
              <p className="text-2xl font-bold text-orange-900">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-900">{approvedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Needs Revision</p>
              <p className="text-2xl font-bold text-yellow-900">{needsRevisionCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Submissions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Submissions</h2>
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
            <Column field="studentName" header="Student" sortable />
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

      {/* Review Dialog */}
      <Dialog
        header="Review Submission"
        visible={reviewDialog}
        style={{ width: '600px' }}
        onHide={() => {
          setReviewDialog(false);
          reset();
        }}
      >
        {selectedSubmission && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-semibold text-gray-900">{selectedSubmission.title}</h4>
              <p className="text-sm text-gray-600">by {selectedSubmission.studentName}</p>
              <p className="text-sm text-gray-600">Project: {selectedSubmission.projectTitle}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status *</label>
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: 'Please select a status' }}
                  render={({ field }) => (
                    <Dropdown
                      {...field}
                      options={statusOptions}
                      placeholder="Select status"
                      className="w-full"
                    />
                  )}
                />
                {errors.status && (
                  <small className="text-red-500">{errors.status.message}</small>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Feedback</label>
                <InputTextarea
                  {...register('feedback')}
                  className="w-full"
                  rows={5}
                  placeholder="Provide feedback to the student..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  label="Cancel"
                  outlined
                  onClick={() => {
                    setReviewDialog(false);
                    reset();
                  }}
                />
                <Button
                  type="submit"
                  label="Submit Review"
                  loading={loading}
                />
              </div>
            </form>
          </div>
        )}
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
                <label className="block text-sm font-medium text-gray-700">Student</label>
                <div className="mt-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">{selectedSubmission.studentName}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project</label>
                <p className="mt-1 text-sm text-gray-900">{selectedSubmission.projectTitle}</p>
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Submitted</label>
                <p className="mt-1 text-sm text-gray-900">
                  {moment(selectedSubmission.createdAt).format('DD MMM YYYY, HH:mm')}
                </p>
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                label="Review"
                icon="pi pi-comment"
                onClick={() => {
                  setViewDialog(false);
                  openReviewDialog(selectedSubmission);
                }}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}