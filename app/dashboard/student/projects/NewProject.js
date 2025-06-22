'use client';

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const NewProject = ({ close, onCreated }) => {
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({ mode: "onBlur" });

    const show = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmitProject = async data => {
        setLoading(true);
        try {
            const res = await fetch("/api/student/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                show("success", "Submit Project", "Project topic submitted successfully");
                setTimeout(() => {
                    reset();
                    close();
                    onCreated?.();
                }, 3000);
            } else {
                const errJson = await res.json().catch(() => ({}));
                const msg = errJson.error || "Failed to submit project topic";
                show("error", "Submit Project", msg);
            }
        } catch (err) {
            console.error("Error submitting project topic:", err);
            show("error", "Submit Project", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card flex justify-content-center">
            <Toast ref={toast} />
            <Dialog
                header="Submit New Project"
                visible
                onHide={close}
                style={{ width: "50vw" }}
            >
                <form onSubmit={handleSubmit(onSubmitProject)} className="space-y-6">
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
                        <Button
                            type="button"
                            label="Cancel"
                            outlined
                            onClick={close}
                        />
                        <Button
                            type="submit"
                            label={loading ? "Submitting..." : "Submit Topic"}
                            loading={loading}
                        />
                    </div>
                </form>
            </Dialog>
        </section>
    );
};

export default NewProject;
