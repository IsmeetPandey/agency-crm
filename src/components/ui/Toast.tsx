import type React from "react";
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
	const icons = {
		success: "✓",
		error: "✕",
		warning: "⚠",
		info: "ℹ",
	};

	const colors = {
		success: {
			badge: "bg-[#EAF6EE] text-[#16834A] border-[#B9E3CB]",
			border: "border-[#B9E3CB]",
		},
		error: {
			badge: "bg-[#FFF0F0] text-[#C62828] border-[#F8C2C2]",
			border: "border-[#F8C2C2]",
		},
		warning: {
			badge: "bg-[#FFF5DF] text-[#A96500] border-[#F5D898]",
			border: "border-[#F5D898]",
		},
		info: {
			badge: "bg-[#EAF6FF] text-[#1677B8] border-[#BDE0F7]",
			border: "border-[#BDE0F7]",
		},
	};

	const style = colors[toast.type] || colors.info;

	return (
		<div
			className={`pointer-events-auto bg-white p-3.5 flex items-start gap-3 rounded-xl border ${style.border} shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150`}
		>
			<span
				className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold border shrink-0 ${style.badge}`}
			>
				{icons[toast.type]}
			</span>

			<div className="flex-1 min-w-0 pr-1">
				{toast.title && (
					<h4 className="text-[13px] font-bold text-[#111111] leading-tight">
						{toast.title}
					</h4>
				)}
				<p className="text-[12px] text-[#666666] font-normal leading-snug mt-0.5">
					{toast.message}
				</p>
			</div>

			<button
				type="button"
				onClick={() => onDismiss(toast.id)}
				className="text-[#808080] hover:text-[#222222] text-[14px] p-0.5 shrink-0 rounded transition"
				aria-label="Dismiss notification"
			>
				×
			</button>
		</div>
	);
};
