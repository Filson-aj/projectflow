"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const NewDepartment = ({ close, onCreated }) => {
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            name: "",
            code: "",
            description: "",
        },
    });

    const showToast = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmitDepartment = async (data) => {
        setLoading(true);
        try {
            const url = "/api/admin/departments";
            const method = "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                showToast("success", "Add Department", "Department created successfully");
                setTimeout(() => {
                    reset();
                    close();
                    onCreated?.();
                }, 1000);
            } else {
                const errJson = await res.json().catch(() => ({}));
                const msg = errJson.error || "Failed to save department";
                showToast("error", "Save Department", msg);
            }
        } catch (err) {
            console.error("Error saving department:", err);
            showToast("error", "Save Department", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header={"Add Department"}
            visible
            onHide={close}
            style={{ width: "50vw" }}
        >
            <Toast ref={toast} />
            <form onSubmit={handleSubmit(onSubmitDepartment)} className="space-y-4">
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
                        label={loading ? "Creating..." : "Create"}
                        loading={loading}
                    />
                </div>
            </form>
        </Dialog>
    );
};

export default NewDepartment;
