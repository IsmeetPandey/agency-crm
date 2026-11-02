import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
	id: string;
	title?: string;
	message: string;
	type: ToastType;
	duration?: number;
}

export interface ToastInput {
	title?: string;
	message?: string;
	description?: string;
	type?: ToastType;
	duration?: number;
}

export type ToastFn = ((input: ToastInput | string) => void) & {
	success: (message: string, title?: string) => void;
	error: (message: string, title?: string) => void;
	info: (message: string, title?: string) => void;
	warning: (message: string, title?: string) => void;
};

export interface ToastContextValue {
	toasts: ToastItem[];
	showToast: (toast: Omit<ToastItem, "id">) => void;
	dismissToast: (id: string) => void;
	toast: ToastFn;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const dismissToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const showToast = useCallback(
		(toastItem: Omit<ToastItem, "id">) => {
			const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
			const newToast: ToastItem = { ...toastItem, id };
			setToasts((prev) => [...prev, newToast]);

			const duration = toastItem.duration ?? 4500;
			if (duration > 0) {
				setTimeout(() => {
					dismissToast(id);
				}, duration);
			}
		},
		[dismissToast],
	);

	const toastFn = useCallback(
		(input: ToastInput | string) => {
			if (typeof input === "string") {
				showToast({ message: input, type: "info" });
			} else {
				showToast({
					message: input.message || input.description || "",
					title: input.title,
					type: input.type || "info",
					duration: input.duration,
				});
			}
		},
		[showToast],
	) as ToastFn;

	toastFn.success = (message: string, title?: string) =>
		showToast({ message, title, type: "success" });
	toastFn.error = (message: string, title?: string) =>
		showToast({ message, title, type: "error" });
	toastFn.info = (message: string, title?: string) =>
		showToast({ message, title, type: "info" });
	toastFn.warning = (message: string, title?: string) =>
		showToast({ message, title, type: "warning" });

	return (
		<ToastContext.Provider
			value={{ toasts, showToast, dismissToast, toast: toastFn }}
		>
			{children}
		</ToastContext.Provider>
	);
};

export const useToast = (): ToastContextValue => {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return ctx;
};
