"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { ConfirmDialog, } from "primereact/confirmdialog";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";
import Student from "./Student";

const Students = () => {
    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState([]);
    const [current, setCurrent] = useState(null);
    const [view, setView] = useState(false);
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
            const res = await fetch("/api/supervisor/students");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const transformed = data.map((u) => ({
                ...u,/* 
                name: `${u.firstName} ${u.lastName}`,
                department: u.department?.name || "—", */
            }));
            setStudents(transformed);
        } catch (err) {
            console.error("Error fetching students:", err);
            show("error", "Fetch Failed", "Could not load students.");
        } finally {
            setLoading(false);
        }
    };

    const handleView = useCallback(() => {
        setView(true);
        panel.current?.hide();
    }, []);


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
        { label: "View", icon: "pi pi-eye", action: handleView },
    ];

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            {view && <Student student={current} visible={view} onClose={() => setView(false)} />}

            <div className="bg-white rounded-md shadow-md space-y-4">
                <div className="flex justify-between items-center border-b px-3 py-2">
                    <h1 className="text-2xl font-bold text-gray-700">All Students</h1>
                </div>

                {/* Search input */}
                <div className="px-2">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search students..."
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
                    value={students}
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
                >
                    <Column field="name" header="Name" sortable />
                    <Column field="email" header="Email" />
                    <Column field="phone" header="Phone" sortable />
                    <Column field="areaOfResearch" header="Area of Research" />
                    <Column
                        body={actionBody}
                        header="Actions"
                        style={{ textAlign: "center", width: "4rem" }}
                    />
                </DataTable>
            </div>

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

export default Students;
