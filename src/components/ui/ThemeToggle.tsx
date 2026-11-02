import type React from "react";
import { useState } from "react";
import { type ThemePreference, useTheme } from "../../lib/theme/theme.context";

interface ThemeToggleProps {
	compact?: boolean;
	showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
	compact = false,
	showLabel = false,
}) => {
	const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
	const [isOpen, setIsOpen] = useState(false);

	const options: { value: ThemePreference; label: string; icon: string }[] = [
		{ value: "light", label: "Light", icon: "☀️" },
		{ value: "dark", label: "Dark", icon: "🌙" },
		{ value: "system", label: "System", icon: "💻" },
	];

	if (compact) {
		return (
			<button
				type="button"
				onClick={toggleTheme}
				className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-sunken)] text-[12px] flex items-center justify-center transition shadow-xs text-[var(--ink)]"
				title={`Current: ${theme} (${resolvedTheme}) — Click to toggle`}
				aria-label="Toggle visual theme"
			>
				{resolvedTheme === "dark" ? "🌙" : "☀️"}
			</button>
		);
	}

	return (
		<div className="relative inline-block text-left">
			<button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition shadow-xs text-[var(--ink)]"
				aria-label="Theme options"
			>
				<span className="text-[12px]">
					{resolvedTheme === "dark" ? "🌙" : "☀️"}
				</span>
				{showLabel && (
					<span className="capitalize text-[var(--ink-secondary)] hidden sm:inline">
						{theme}
					</span>
				)}
				<span className="text-[9px] text-[var(--ink-muted)]">▾</span>
			</button>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>
					<div className="absolute right-0 top-8 z-50 w-32 p-1 studio-modal shadow-lg border border-[var(--border)] animate-in fade-in space-y-0.5">
						{options.map((opt) => (
							<button
								key={opt.value}
								type="button"
								onClick={() => {
									setTheme(opt.value);
									setIsOpen(false);
								}}
								className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium transition ${
									theme === opt.value
										? "bg-[var(--accent-tint)] text-[var(--accent-text)] font-semibold"
										: "text-[var(--ink)] hover:bg-[var(--surface-sunken)]"
								}`}
							>
								<span className="flex items-center gap-2">
									<span>{opt.icon}</span>
									<span>{opt.label}</span>
								</span>
								{theme === opt.value && <span>✓</span>}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
};
