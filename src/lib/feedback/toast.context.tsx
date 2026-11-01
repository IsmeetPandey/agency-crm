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

interface ToastContextValue {
	toasts: ToastItem[];
	showToast: (toast: Omit<ToastItem, "id">) => void;
	dismissToast: (id: string) => void;
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
		(toast: Omit<ToastItem, "id">) => {
			const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
			const newToast: ToastItem = { ...toast, id };
			setToasts((prev) => [...prev, newToast]);

			const duration = toast.duration ?? 4500;
			if (duration > 0) {
				setTimeout(() => {
					dismissToast(id);
				}, duration);
			}
		},
		[dismissToast],
	);

	return (
		<ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
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
