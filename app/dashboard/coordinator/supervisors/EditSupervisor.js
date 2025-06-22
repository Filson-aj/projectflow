"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const EditSupervisor = ({ supervisor, close, onUpdated }) => {
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
            firstName: supervisor?.firstName || "",
            lastName: supervisor?.lastName || "",
            email: supervisor?.email || "",
            phone: supervisor?.phone || "",
            areaOfResearch: supervisor?.areaOfResearch || "",
            maxStudents: supervisor?.maxStudents ?? null,
        },
    });

    useEffect(() => {
        if (supervisor) {
            reset({
                firstName: supervisor.firstName || "",
                lastName: supervisor.lastName || "",
                phone: supervisor.phone || "",
                areaOfResearch: supervisor.areaOfResearch || "",
                maxStudents: supervisor.maxStudents ?? null,
            });
        }
    }, [supervisor, reset]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/coordinator/supervisors?id=${encodeURIComponent(supervisor.id)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }
            );

            if (res.ok) {
                const updatedSupervisor = await res.json();
                onUpdated(updatedSupervisor);
                toast.current.show({ severity: "success", summary: "Edit Supervisor", detail: "Supervisor updated successfully", life: 3000 });
                close();
            } else {
                const errJson = await res.json().catch(() => ({}));
                toast.current.show({ severity: "error", summary: "Edit Supervisor", detail: errJson.error || "Failed to update supervisor", life: 3000 });
            }
        } catch (err) {
            console.error("Error updating supervisor:", err);
            toast.current.show({ severity: "error", summary: "Edit Supervisor", detail: "An unexpected error occurred", life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    /*  if (deptLoading) {
         return <Spinner visible />;
     } */

    return (
        <section className="card flex justify-content-center">
            <Toast ref={toast} />
            <Dialog header="Edit Supervisor" visible onHide={close} style={{ width: "50vw" }}>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">First Name</label>
                            <InputText
                                {...register("firstName", { required: "First name is required" })}
                                className={`w-full ${errors.firstName ? 'p-invalid' : ''}`}
                            />
                            {errors.firstName && <small className="text-red-500">{errors.firstName.message}</small>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Last Name</label>
                            <InputText
                                {...register("lastName", { required: "Last name is required" })}
                                className={`w-full ${errors.lastName ? 'p-invalid' : ''}`}
                            />
                            {errors.lastName && <small className="text-red-500">{errors.lastName.message}</small>}
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="">
                        <label htmlFor="phone" className="block text-sm font-mediummb-2">Phone Number</label>
                        <InputText
                            id="phone"
                            {...register('phone', { pattern: { value: /^[\+]?[0-9]{1,16}$/, message: 'Invalid phone' } })}
                            className={`w-full ${errors.phone ? 'p-invalid' : ''}`}
                        />
                        {errors.phone && <small className="text-red-500">{errors.phone.message}</small>}
                    </div>


                    <div>
                        <label className="block text-sm font-medium mb-2">Area of Research</label>
                        <InputTextarea {...register("areaOfResearch")} rows={3} className="w-full" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Max Students (for Supervisors)</label>
                        <InputText
                            {...register("maxStudents", {
                                valueAsNumber: true,
                                validate: (v) => v == null || v >= 0 || "Must be a non-negative number",
                            })}
                            type="number"
                            className={`w-full ${errors.maxStudents ? 'p-invalid' : ''}`}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" label="Cancel" outlined onClick={close} />
                        <Button type="submit" label={loading ? "Updating..." : "Update"} loading={loading} />
                    </div>
                </form>
            </Dialog>
        </section>
    );
};

export default EditSupervisor;
