'use client';

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const EditProject = ({ project, close, onUpdated }) => {
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            title: project?.title || "",
            description: project?.description || ""
        }
    });

    useEffect(() => {
        if (project) {
            reset({
                title: project.title,
                description: project.description
            });
        }
    }, [project, reset]);

    const show = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmit = async data => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/student/projects?id=${encodeURIComponent(project.id)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                }
            );

            if (res.ok) {
                const updated = await res.json();
                onUpdated(updated);
                show("success", "Edit Project", "Project updated successfully");
                close();
            } else {
                const errJson = await res.json().catch(() => ({}));
                show(
                    "error",
                    "Edit Project",
                    errJson.error || "Failed to update project"
                );
            }
        } catch (err) {
            console.error("Error updating project:", err);
            show("error", "Edit Project", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card flex justify-content-center">
            <Toast ref={toast} />
            <Dialog
                header="Edit Project"
                visible
                onHide={close}
                style={{ width: "50vw" }}
            >
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Project Title
                        </label>
                        <InputText
                            {...register("title", { required: "Title is required" })}
                            placeholder="Enter project title"
                            className={`w-full ${errors.title ? "p-invalid" : ""}`}
                        />
                        {errors.title && (
                            <small className="text-red-500">{errors.title.message}</small>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Project Description
                        </label>
                        <InputTextarea
                            {...register("description", {
                                required: "Description is required"
                            })}
                            rows={5}
                            placeholder="Describe your project in detail"
                            className={`w-full ${errors.description ? "p-invalid" : ""}`}
                        />
                        {errors.description && (
                            <small className="text-red-500">
                                {errors.description.message}
                            </small>
                        )}
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

export default EditProject;
