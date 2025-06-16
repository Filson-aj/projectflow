"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import Spinner from "@/components/Spinner/Spinner";

const EditUser = ({ user, close, onUpdated }) => {
    const [departments, setDepartments] = useState([]);
    const [deptLoading, setDeptLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    const initialDeptId =
        user?.supervisorDepartmentId ??
        user?.coordinatedDepartmentId ??
        user?.studentDepartmentId ??
        null;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.email || "",
            role: user?.role || null,
            departmentId: initialDeptId,
            areaOfResearch: user?.areaOfResearch || "",
            maxStudents: user?.maxStudents ?? null,
        },
    });

    const roleOptions = [
        { label: "Coordinator", value: "COORDINATOR" },
        { label: "Supervisor", value: "SUPERVISOR" },
    ];

    const departmentOptions = departments.map((d) => ({
        label: `${d.name} (${d.code})`,
        value: d.id,
    }));

    useEffect(() => {
        setDeptLoading(true);
        (async () => {
            try {
                const res = await fetch("/api/admin/departments");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                setDepartments(await res.json());
            } catch (err) {
                console.error("Failed to fetch departments:", err);
                toast.current.show({ severity: "error", summary: "Load Error", detail: "Could not load departments", life: 3000 });
            } finally {
                setDeptLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (user && !deptLoading) {
            const deptId =
                user.supervisorDepartmentId ??
                user.coordinatedDepartmentId ??
                user.studentDepartmentId ??
                null;
            reset({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                role: user.role || null,
                departmentId: deptId,
                areaOfResearch: user.areaOfResearch || "",
                maxStudents: user.maxStudents ?? null,
            });
        }
    }, [user, reset, deptLoading]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/admin/users?id=${encodeURIComponent(user.id)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }
            );

            if (res.ok) {
                const updatedUser = await res.json();
                onUpdated(updatedUser);
                toast.current.show({ severity: "success", summary: "Edit User", detail: "User updated successfully", life: 3000 });
                close();
            } else {
                const errJson = await res.json().catch(() => ({}));
                toast.current.show({ severity: "error", summary: "Edit User", detail: errJson.error || "Failed to update user", life: 3000 });
            }
        } catch (err) {
            console.error("Error updating user:", err);
            toast.current.show({ severity: "error", summary: "Edit User", detail: "An unexpected error occurred", life: 3000 });
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
            <Dialog header="Edit User" visible onHide={close} style={{ width: "50vw" }}>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">First Name</label>
                            <InputText
                                {...register("firstName", { required: "First name is required" })}
                                className="w-full"
                            />
                            {errors.firstName && <small className="text-red-500">{errors.firstName.message}</small>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Last Name</label>
                            <InputText
                                {...register("lastName", { required: "Last name is required" })}
                                className="w-full"
                            />
                            {errors.lastName && <small className="text-red-500">{errors.lastName.message}</small>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <InputText
                            {...register("email", {
                                required: "Email is required",
                                pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
                            })}
                            type="email"
                            className="w-full"
                        />
                        {errors.email && <small className="text-red-500">{errors.email.message}</small>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Role</label>
                            <Controller
                                name="role"
                                control={control}
                                rules={{ required: "Role is required" }}
                                render={({ field }) => <Dropdown {...field} options={roleOptions} placeholder="Select Role" className="w-full" />}
                            />
                            {errors.role && <small className="text-red-500">{errors.role.message}</small>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Department</label>
                            {deptLoading ? (
                                <div className="flex justify-center items-center py-4">
                                    <ProgressSpinner
                                        style={{ width: "50px", height: "50px" }}
                                        strokeWidth="6"
                                        fill="var(--surface-ground)"
                                        animationDuration=".5s"
                                    />
                                </div>
                            ) : (<Controller
                                name="departmentId"
                                control={control}
                                rules={{ required: "Department is required" }}
                                render={({ field }) => <Dropdown {...field} options={departmentOptions} placeholder="Select Department" className="w-full" />}
                            />)}
                            {errors.departmentId && <small className="text-red-500">{errors.departmentId.message}</small>}
                        </div>
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
                            className="w-full"
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

export default EditUser;
