"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";

const EditDepartment = ({ department, close, onUpdated }) => {
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);


    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            name: department?.name || "",
            code: department?.code || "",
            description: department?.description || "",
        },
    });

    useEffect(() => {
        if (department) {
            reset({
                name: department.name || "",
                code: department.code || "",
                description: department.description || "",
            });
        }
    }, [department, reset]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/admin/departments?id=${encodeURIComponent(department.id)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }
            );

            if (res.ok) {
                const updatedDepartment = await res.json();
                onUpdated(updatedDepartment);
                toast.current.show({ severity: "success", summary: "Edit Department", detail: "Department updated successfully", life: 3000 });
                close();
            } else {
                const errJson = await res.json().catch(() => ({}));
                toast.current.show({ severity: "error", summary: "Edit Department", detail: errJson.error || "Failed to update department", life: 3000 });
            }
        } catch (err) {
            console.error("Error updating department:", err);
            toast.current.show({ severity: "error", summary: "Edit Department", detail: "An unexpected error occurred", life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card flex justify-content-center">
            <Toast ref={toast} />
            <Dialog header="Edit Department" visible onHide={close} style={{ width: "50vw" }}>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <InputText
                            {...register("name", { required: "Name is required" })}
                            className="w-full"
                            placeholder="Department Name"
                        />
                        {errors.name && <small className="text-red-500">{errors.name.message}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Code</label>
                        <InputText
                            {...register("code", { required: "Code is required" })}
                            className="w-full"
                            placeholder="Department Code"
                        />
                        {errors.code && <small className="text-red-500">{errors.code.message}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <InputTextarea
                            {...register("description")}
                            className="w-full"
                            rows={3}
                            placeholder="Department Description"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" label="Cancel" outlined onClick={close} />
                        <Button
                            type="submit"
                            label={loading ? "Updating..." : "Update"}
                            loading={loading}
                        />
                    </div>
                </form>
            </Dialog>
        </section>
    );
};

export default EditDepartment;
