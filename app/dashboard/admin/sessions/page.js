"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import Spinner from "@/components/Spinner/Spinner";
import moment from "moment";
import NewSession from "./NewSession";
import EditSession from "./EditSession";

const Sessions = () => {
    const [sessions, setSessions] = useState([]);
    const [selected, setSelected] = useState([]);
    const [current, setCurrent] = useState(null);
    const [create, setCreate] = useState(false);
    const [edit, setEdit] = useState(false);
    const [deletingIds, setDeletingIds] = useState([]);
    const [loading, setLoading] = useState(false);
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
            const res = await fetch("/api/admin/sessions");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setSessions(data);
        } catch (err) {
            console.error("Error fetching sessions:", err);
            show("error", "Fetch Failed", "Could not load sessions.");
        } finally {
            setLoading(false);
        }
    };

    const deleteApi = async (ids) => {
        const query = ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/admin/sessions?${query}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res;
    };

    const confirmDelete = useCallback(
        (ids) => {
            confirmDialog({
                message:
                    ids.length === 1
                        ? "Do you really want to delete this session?"
                        : `Do you really want to delete these ${ids.length} sessions?`,
                header: "Confirm Deletion",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                rejectClassName: "p-button-text",
                accept: async () => {
                    setDeletingIds(ids);
                    try {
                        await deleteApi(ids);
                        show(
                            "success",
                            "Deleted",
                            ids.length === 1 ? "Session deleted." : `${ids.length} sessions deleted.`
                        );
                        fetchData();
                        //setSessions((prev) => prev.filter((u) => !ids.includes(u.id)));
                        setSelected((prev) => prev.filter((u) => !ids.includes(u.id)));
                    } catch (err) {
                        console.error("Delete error:", err);
                        show("error", "Delete Failed", err.message);
                    } finally {
                        setDeletingIds([]);
                    }
                },
            });
        },
        []
    );

    const deleteOne = useCallback(
        (id) => {
            panel.current?.hide();
            confirmDelete([id]);

        },
        [confirmDelete]
    );

    const handleNew = useCallback(() => setCreate(true), []);

    const handleEdit = useCallback(() => {
        setEdit(true);
        panel.current?.hide();
    }, []);

    const handleUpdate = useCallback(
        (updated) => {
            setSessions((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            setEdit(false);
            show("success", "Updated", "Session updated successfully.");
        },
        []
    );

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
        { label: "Edit", icon: "pi pi-pencil", action: handleEdit },
        { label: "Delete", icon: "pi pi-trash", action: () => current && deleteOne(current.id) },
    ];

    const statusBody = (row) => (
        <Tag
            value={row.isActive ? "Active" : "Inactive"}
            severity={row.isActive ? "success" : "danger"}
        />
    );

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            {deletingIds.length > 0 && <Spinner visible onHide={() => setDeletingIds([])} />}
            {create && <NewSession close={() => setCreate(false)} onCreated={fetchData} />}
            {edit && (
                <EditSession
                    sessionData={current}
                    close={() => setEdit(false)}
                    onUpdated={handleUpdate}
                />
            )}

            <div className="bg-white rounded-md shadow-md space-y-4">
                <div className="flex justify-between items-center border-b px-3 py-2">
                    <h1 className="text-2xl font-bold text-gray-700">All Sessions</h1>
                    <Button label="Add New" icon="pi pi-plus" onClick={handleNew} className="p-button-sm" />
                </div>

                <div className="px-2">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search sessions..."
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
                    value={sessions}
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
                    loading={loading}
                    selectionMode="multiple"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
                    <Column field="name" header="Name" sortable />
                    <Column
                        field="startDate"
                        header="Start"
                        body={(row) => moment(row.startDate).format("DD MMM YYYY")}
                        sortable
                    />
                    <Column
                        field="endDate"
                        header="End"
                        body={(row) => moment(row.endDate).format("DD MMM YYYY")}
                        sortable
                    />
                    <Column header="Status" body={statusBody} />
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
                    {overlayActions.map(({ label, icon, action }) => (
                        <Button
                            key={label}
                            label={label}
                            icon={icon}
                            className="p-button-text text-gray-900 hover:text-blue-600 hover:border-none hover:shadow-none hover:bg-transparent"
                            onClick={action}
                        />
                    ))}
                </div>
            </OverlayPanel>
        </section>
    );
};

export default Sessions;
