"use client";
import { ReactNode, useEffect } from "react";

export default function Modal({
    open,
    onClose,
    title,
    children
}: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}) {
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b p-3">
                        <div className="text-sm font-medium">{title}</div>
                        <button onClick={onClose} className="rounded p-1 hover:bg-neutral-100">
                            ✕
                        </button>
                    </div>
                    <div className="max-h-[80vh] overflow-auto p-4">{children}</div>
                </div>
            </div>
        </div>
    );
}
