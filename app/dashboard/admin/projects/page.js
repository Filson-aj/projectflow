"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { ConfirmDialog } from "primereact/confirmdialog";
import { FilterMatchMode } from "primereact/api";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import Spinner from "@/components/Spinner/Spinner";
import moment from "moment";

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [selected, setSelected] = useState([]);
    const [current, setCurrent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [approving, setApproving] = useState(false);
    const toast = useRef(null);
    const panel = useRef(null);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });

    useEffect(() => {
        fetchData();
    }, []);

    const show = (type, title, message) => {
        toast.current.show({ severity: type, summary: title, detail: message });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/projects");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const transformed = data.map((u) => ({
                ...u,
            }));
            setProjects(transformed);
        } catch (err) {
            console.error("Error fetching projects:", err);
            show("error", "Fetch Failed", "Could not load projects.");
        } finally {
            setLoading(false);
        }
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

    const approveProject = async (id) => {
        setApproving(true);
        panel.current.hide();
        try {
            const res = await fetch(`/api/admin/projects/${id}/approve`, {
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
            const res = await fetch(`/api/admin/projects/${id}/reject`, { method: 'PUT' });
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

    const overlayActions = [
        { label: "Approve", icon: "pi pi-check", action: () => current && approveProject(current.id) },
        { label: "Reject", icon: "pi pi-times", action: () => current && rejectProject(current.id) },
    ];

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            {approving && <Spinner visible onHide={() => setApproving(false)} />}

            <div className="bg-white rounded-md shadow-md space-y-4">
                <div className="flex justify-between items-center border-b px-3 py-2">
                    <h1 className="text-2xl font-bold text-gray-700">All Project Topics</h1>
                </div>

                {/* Search input */}
                <div className="px-2">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search project topics..."
                            onInput={(e) =>
                                setFilters({
                                    global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
                                })
                            }
                            className="w-full rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 px-8 py-2"
                        />
                    </span>
                </div>

                <DataTable
                    value={projects}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    stripedRows
                    filters={filters}
                    filterDisplay="menu"
                    scrollable
                    scrollHeight="400px"
                    dataKey="id"
                    selection={selected}
                    onSelectionChange={(e) => setSelected(e.value)}
                    emptyMessage="There are no project topics found."
                    loading={loading}
                >
                    <Column field="title" header="Title" sortable />
                    <Column field="studentName" header="Student" sortable />
                    <Column field="supervisorName" header="Supervisor" sortable />
                    <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                    <Column
                        field="createdAt"
                        header="Created"
                        body={(row) => moment(row.createdAt).format("DD MMM YYYY")}
                        sortable
                    />
                    <Column
                        body={actionBody}
                        header="Actions"
                        style={{ textAlign: "center", width: "4rem" }}
                    />
                </DataTable>
            </div>

            {selected.length > 0 && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} record(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map((u) => u.id))}
                        loading={deletingIds.length > 0}
                        disabled={deletingIds.length > 0}
                    />
                </div>
            )}

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
};

export default Projects;
