"use client";

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const User = ({ user, visible, onClose }) => {
    return (
        <Dialog
            header="User Details"
            visible={visible}
            onHide={onClose}
            style={{ width: "70vw", borderRadius: '1rem' }}
        >
            <div className="flex justify-between gap-4 bg-gray-200 p-3">
                <div className="w-1/3 flex flex-col items-center justify-center bg-white rounded-md shadow-md">
                    <div className="flex justify-center gap-1">
                        <p className="text-gray-300/40 font-bold text-xl text-center py-1 uppercase"> {user.firstName} {user.lastName}</p>
                    </div>
                    <div className="flex justify-center gap-2">
                        <p className="text-gray-100 font-bold text-sm italic text-center py-1"> {user.email}</p>
                    </div>
                </div>
                <div className="w-2/3 flex flex-col  bg-white rounded-md shadow-md">
                    <div className="border-b border-gray-200 flex items-center py-2">
                        <span className="font-bold px-2">Role:</span> <p> {user.role}</p>
                    </div>
                    <div className="border-b border-gray-200 flex items-center py-2">
                        <span className="font-bold px-2">Department:</span> <p> {user.department}</p>
                    </div>
                    <div className="border-b border-gray-200 flex items-center py-2">
                        <span className="font-bold px-2">Area of Research:</span> <p> {user.areaOfResearch}</p>
                    </div>
                    <div className="border-b border-gray-200 flex items-center py-2">
                        <span className="font-bold px-2">Max Students:</span> <p> {user.maxStudents != null ? user.maxStudents : '-'}</p>
                    </div>
                </div>

            </div>
            <div className="w-full flex items-center justify-center border-t border-gray-300/40 my-2 py-2">
                <Button label="Close" onClick={onClose} className=" w-full mx-3" />
            </div>
        </Dialog>
    );
};

export default User;
