"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const NewSupervisor = ({ close, onCreated }) => {
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({ mode: "onBlur" });


    const show = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmit = async (data) => {
        setLoading(true);
        const payload = {
            ...data,
            password: 'password',
            role: 'SUPERVISOR',
        }
        try {
            const res = await fetch("/api/coordinator/supervisors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                show("success", "Add Supervisor", "Supervisor created successfully");
                setTimeout(() => {
                    reset();
                    close();
                    onCreated?.();
                }, 3000);
            } else {
                const errJson = await res.json().catch(() => ({}));
                const msg = errJson.error || "Failed to create supervisor";
                show("error", "Add Supervisor", msg);
            }
        } catch (err) {
            console.error("Error creating supervisor:", err);
            show("error", "Add Supervisor", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card flex justify-content-center">
            <Toast ref={toast} />
            <Dialog header="Add Supervisor" visible onHide={close} style={{ width: "50vw" }}>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">First Name</label>
                            <InputText
                                {...register("firstName", { required: "First name is required" })}
                                placeholder="First Name"
                                className={`w-full ${errors.firstName ? 'p-invalid' : ''}`}
                            />
                            {errors.firstName && (
                                <small className="text-red-500">{errors.firstName.message}</small>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Last Name</label>
                            <InputText
                                {...register("lastName", { required: "Last name is required" })}
                                placeholder="Last Name"
                                className={`w-full ${errors.lastName ? 'p-invalid' : ''}`}
                            />
                            {errors.lastName && (
                                <small className="text-red-500">{errors.lastName.message}</small>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <InputText
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^\S+@\S+$/i,
                                    message: "Invalid email address",
                                },
                            })}
                            type="email"
                            placeholder="Email Address"
                            className={`w-full ${errors.email ? 'p-invalid' : ''}`}
                        />
                        {errors.email && (
                            <small className="text-red-500">{errors.email.message}</small>
                        )}
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
                        <InputTextarea
                            {...register("areaOfResearch")}
                            rows={3}
                            placeholder="Area of Research"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Max Students (for Supervisors)
                        </label>
                        <InputText
                            {...register("maxStudents", {
                                valueAsNumber: true,
                                validate: (v) =>
                                    v == null || v >= 0 || "Must be a non-negative number",
                            })}
                            type="number"
                            placeholder="Maximum number of students"
                            className={`w-full ${errors.maxStudents ? 'p-invalid' : ''}`}
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
        </section>
    );
};

export default NewSupervisor;
