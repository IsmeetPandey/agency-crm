import type React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { type ToastItem, useToast } from "../../lib/feedback/toast.context";

export const ToastContainer: React.FC = () => {
	const { toasts, dismissToast } = useToast();

	if (toasts.length === 0) return null;

	return (
		<div
			aria-live="polite"
			className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
		>
			{toasts.map((toast) => (
				<ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
			))}
		</div>
	);
};

interface ToastCardProps {
	toast: ToastItem;
}

const ToastCard: React.FC<
	ToastCardProps & { onDismiss: (id: string) => void }
> = ({ toast, onDismiss }) => {
	const iconMap = {
		success: CheckCircle2,
		error: AlertCircle,
		warning: AlertTriangle,
		info: Info,
	};

	const colors = {
		success: {
			badge: "bg-[#EAF6EE] text-[#16834A] border-[#B9E3CB] dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800",
			border: "border-[#B9E3CB] dark:border-emerald-850",
		},
		error: {
			badge: "bg-[#FFF0F0] text-[#C62828] border-[#F8C2C2] dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800",
			border: "border-[#F8C2C2] dark:border-rose-850",
		},
		warning: {
			badge: "bg-[#FFF5DF] text-[#A96500] border-[#F5D898] dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800",
			border: "border-[#F5D898] dark:border-amber-850",
		},
		info: {
			badge: "bg-[#EAF6FF] text-[#1677B8] border-[#BDE0F7] dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800",
			border: "border-[#BDE0F7] dark:border-sky-850",
		},
	};

	const style = colors[toast.type] || colors.info;
	const Icon = iconMap[toast.type] || Info;

	return (
		<div
			className={`pointer-events-auto bg-white dark:bg-slate-900 p-3.5 flex items-start gap-3 rounded-xl border ${style.border} shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150`}
		>
			<span
				className={`w-6 h-6 rounded-full flex items-center justify-center p-1 border shrink-0 ${style.badge}`}
			>
				<Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
			</span>

			<div className="flex-1 min-w-0 pr-1">
				{toast.title && (
					<h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
						{toast.title}
					</h4>
				)}
				<p className="text-[12px] text-slate-600 dark:text-slate-300 font-normal leading-snug mt-0.5">
					{toast.message}
				</p>
			</div>

			<button
				type="button"
				onClick={() => onDismiss(toast.id)}
				className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 shrink-0 rounded transition cursor-pointer"
				aria-label="Dismiss notification"
			>
				<X className="w-4 h-4" />
			</button>
		</div>
	);
};
