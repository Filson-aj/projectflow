"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const EditSession = ({ sessionData, close, onUpdated }) => {
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            name: sessionData?.name || "",
            startDate: sessionData?.startDate ? new Date(sessionData.startDate) : null,
            endDate: sessionData?.endDate ? new Date(sessionData.endDate) : null
        }
    });

    useEffect(() => {
        if (sessionData) {
            reset({
                name: sessionData.name || "",
                startDate: sessionData.startDate ? new Date(sessionData.startDate) : null,
                endDate: sessionData.endDate ? new Date(sessionData.endDate) : null
            });
        }
    }, [sessionData, reset]);

    const showToast = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/admin/sessions?id=${encodeURIComponent(sessionData.id)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: data.name,
                        startDate: data.startDate,
                        endDate: data.endDate
                    })
                }
            );

            if (res.ok) {
                const updated = await res.json();
                onUpdated(updated);
                showToast("success", "Edit Session", "Session updated successfully");
                close();
            } else {
                const errJson = await res.json().catch(() => ({}));
                showToast("error", "Edit Session", errJson.error || "Failed to update session");
            }
        } catch (err) {
            console.error("Error updating session:", err);
            showToast("error", "Edit Session", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card flex justify-content-center">
            <Toast ref={toast} />
            <Dialog header="Edit Session" visible onHide={close} style={{ width: "50vw" }}>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {/* Session Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Session Name</label>
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: "Name is required" }}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    className="w-full"
                                    placeholder="Enter session name"
                                />
                            )}
                        />
                        {errors.name && <small className="text-red-500">{errors.name.message}</small>}
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <Controller
                            name="startDate"
                            control={control}
                            rules={{ required: "Start date is required" }}
                            render={({ field }) => (
                                <Calendar
                                    {...field}
                                    showIcon
                                    dateFormat="yy-mm-dd"
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.startDate && <small className="text-red-500">{errors.startDate.message}</small>}
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2">End Date</label>
                        <Controller
                            name="endDate"
                            control={control}
                            rules={{ required: "End date is required" }}
                            render={({ field }) => (
                                <Calendar
                                    {...field}
                                    showIcon
                                    dateFormat="yy-mm-dd"
                                    className="w-full"
                                    minDate={field.value}
                                />
                            )}
                        />
                        {errors.endDate && <small className="text-red-500">{errors.endDate.message}</small>}
                    </div>

                    {/* Actions */}
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

export default EditSession;
