"use client";

import React, { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const NewSession = ({ close, onCreated }) => {
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        formState: { errors },
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            name: "",
            startDate: null,
            endDate: null
        },
    });

    const showToast = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmitSession = async (data) => {
        setLoading(true);
        const payload = {
            ...data,
            isActive: true,
        }
        try {
            const res = await fetch("/api/admin/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                showToast("success", "Add Session", "Session created successfully");
                setTimeout(() => {
                    reset();
                    close();
                    onCreated?.();
                }, 1000);
            } else {
                const errJson = await res.json().catch(() => ({}));
                const msg = errJson.error || "Failed to save session";
                showToast("error", "Save Session", msg);
            }
        } catch (err) {
            console.error("Error saving session:", err);
            showToast("error", "Save Session", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header="Add Session"
            visible
            onHide={close}
            style={{ width: "50vw" }}
        >
            <Toast ref={toast} />
            <form onSubmit={handleSubmit(onSubmitSession)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Session Name</label>
                    <InputText
                        {...register("name", { required: "Name is required" })}
                        className="w-full"
                        placeholder="Enter session name"
                    />
                    {errors.name && <small className="text-red-500">{errors.name.message}</small>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <Controller
                        name="startDate"
                        control={control}
                        rules={{ required: "Start date is required" }}
                        render={({ field }) => (
                            <Calendar
                                id="startDate"
                                value={field.value}
                                onChange={field.onChange}
                                showIcon
                                dateFormat="yy-mm-dd"
                                className="w-full"
                            />
                        )}
                    />
                    {errors.startDate && <small className="text-red-500">{errors.startDate.message}</small>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <Controller
                        name="endDate"
                        control={control}
                        rules={{ required: "End date is required" }}
                        render={({ field }) => (
                            <Calendar
                                id="endDate"
                                value={field.value}
                                onChange={field.onChange}
                                showIcon
                                dateFormat="yy-mm-dd"
                                className="w-full"
                                minDate={watch('startDate')}
                            />
                        )}
                    />
                    {errors.endDate && <small className="text-red-500">{errors.endDate.message}</small>}
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

export default NewSession;
