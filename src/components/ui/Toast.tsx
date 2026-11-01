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
	onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
	const icons = {
		success: "✓",
		error: "✕",
		warning: "⚠",
		info: "ℹ",
	};

	const colors = {
		success: {
			badge: "bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30",
			border: "border-[#30D158]/25",
			glow: "shadow-[0_8px_24px_rgba(48,209,88,0.15)]",
		},
		error: {
			badge: "bg-[#FF2D55]/15 text-[#FF2D55] border-[#FF2D55]/30",
			border: "border-[#FF2D55]/25",
			glow: "shadow-[0_8px_24px_rgba(255,45,85,0.15)]",
		},
		warning: {
			badge: "bg-[#FF9500]/15 text-[#FF9500] border-[#FF9500]/30",
			border: "border-[#FF9500]/25",
			glow: "shadow-[0_8px_24px_rgba(255,149,0,0.15)]",
		},
		info: {
			badge: "bg-[#007AFF]/15 text-[#007AFF] border-[#007AFF]/30",
			border: "border-[#007AFF]/25",
			glow: "shadow-[0_8px_24px_rgba(0,122,255,0.15)]",
		},
	};

	const style = colors[toast.type] || colors.info;

	return (
		<div
			className={`pointer-events-auto liquid-modal p-3.5 flex items-start gap-3 backdrop-blur-xl border ${style.border} ${style.glow} animate-in fade-in slide-in-from-bottom-2 duration-200`}
		>
			<span
				className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-[700] border shrink-0 ${style.badge}`}
			>
				{icons[toast.type]}
			</span>

			<div className="flex-1 min-w-0 pr-1">
				{toast.title && (
					<h4 className="text-[13px] font-[650] text-[#1D1D1F] leading-tight">
						{toast.title}
					</h4>
				)}
				<p className="text-[12px] text-[#48484A] font-[450] leading-snug mt-0.5">
					{toast.message}
				</p>
			</div>

			<button
				type="button"
				onClick={() => onDismiss(toast.id)}
				className="text-[#86868B] hover:text-[#1D1D1F] text-[14px] p-0.5 shrink-0 rounded transition"
			>
				×
			</button>
		</div>
	);
};
