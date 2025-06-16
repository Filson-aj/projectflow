"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const NewUser = ({ close, onCreated }) => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm({ mode: "onBlur" });

    const roleOptions = [
        { label: "Coordinator", value: "COORDINATOR" },
        { label: "Supervisor", value: "SUPERVISOR" },
    ];

    const departmentOptions = departments.map((dept) => ({
        label: dept.name,
        value: dept.id,
    }));

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/admin/departments");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                setDepartments(await res.json());
            } catch (err) {
                console.error("Failed to fetch departments:", err);
                show("error", "Load Error", "Could not load departments");
            }
        })();
    }, []);

    const show = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmit = async (data) => {
        setLoading(true);
        const payload = {
            ...data,
            password: 'password',
        }
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                show("success", "Add User", "User created successfully");
                setTimeout(() => {
                    reset();
                    close();
                    onCreated?.();
                }, 3000);
            } else {
                const errJson = await res.json().catch(() => ({}));
                const msg = errJson.error || "Failed to create user";
                show("error", "Add User", msg);
            }
        } catch (err) {
            console.error("Error creating user:", err);
            show("error", "Add User", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card flex justify-content-center">
            <Toast ref={toast} />
            <Dialog header="Add User" visible onHide={close} style={{ width: "50vw" }}>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">First Name</label>
                            <InputText
                                {...register("firstName", { required: "First name is required" })}
                                placeholder="First Name"
                                className="w-full"
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
                                className="w-full"
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
                            className="w-full"
                        />
                        {errors.email && (
                            <small className="text-red-500">{errors.email.message}</small>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Role</label>
                            <Controller
                                name="role"
                                control={control}
                                rules={{ required: "Role is required" }}
                                render={({ field }) => (
                                    <Dropdown
                                        {...field}
                                        options={roleOptions}
                                        placeholder="Select Role"
                                        className="w-full"
                                    />
                                )}
                            />
                            {errors.role && (
                                <small className="text-red-500">{errors.role.message}</small>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Department</label>
                            <Controller
                                name="departmentId"
                                control={control}
                                rules={{ required: "Department is required" }}
                                render={({ field }) => (
                                    <Dropdown
                                        {...field}
                                        options={departmentOptions}
                                        placeholder="Select Department"
                                        className="w-full"
                                    />
                                )}
                            />
                            {errors.departmentId && (
                                <small className="text-red-500">{errors.departmentId.message}</small>
                            )}
                        </div>
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
                            className="w-full"
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

export default NewUser;
