import type React from "react";
import { useAuth } from "../../lib/auth/auth.context";

interface TopbarProps {
	viewTitle: string;
	search: string;
	setSearch: (s: string) => void;
	openCmd: () => void;
	openModal: (type: string) => void;
	onMobileMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
	viewTitle,
	search,
	setSearch,
	openCmd,
	openModal,
	onMobileMenuToggle,
}) => {
	const { user, role } = useAuth();

	return (
		<header className="sticky top-0 z-30 liquid-topbar flex items-center justify-between px-4 lg:px-6 h-[52px]">
			{/* Title & mobile toggle */}
			<div className="flex items-center gap-3 min-w-0">
				<button
					type="button"
					onClick={onMobileMenuToggle}
					className="lg:hidden p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04]"
				>
					☰
				</button>
				<div className="flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.6)]" />
					<h1 className="text-[15px] font-[650] tracking-[-0.015em] text-[#1D1D1F] truncate">
						{viewTitle}
					</h1>
				</div>
			</div>

			{/* Center Search Pill */}
			<div className="hidden md:flex items-center flex-1 max-w-[340px] mx-4">
				<div className="relative w-full">
					<input
						type="text"
						placeholder="Search leads, clients, projects... (⌘K)"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onClick={openCmd}
						className="search-pill w-full pl-9 pr-12 text-[12px] text-[#1D1D1F] placeholder-[#86868B]"
					/>
					<span className="absolute left-3 top-2 text-[12px] text-[#86868B]">
						🔍
					</span>
					<kbd className="absolute right-2.5 top-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/[0.06] text-[#86868B]">
						⌘K
					</kbd>
				</div>
			</div>

			{/* Right Actions & Profile */}
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => openModal("lead")}
					className="btn-liquid btn-liquid-primary !h-[28px] !text-[12px] !px-3"
				>
					+ Lead
				</button>
				<button
					type="button"
					onClick={() => openModal("project")}
					className="hidden sm:inline-flex btn-liquid !h-[28px] !text-[12px] !px-3"
				>
					+ Project
				</button>
				<button
					type="button"
					onClick={() => openModal("task")}
					className="hidden sm:inline-flex btn-liquid !h-[28px] !text-[12px] !px-3"
				>
					+ Task
				</button>

				{/* User Role Badge & Avatar */}
				<div className="flex items-center gap-2 ml-2 pl-2 border-l border-black/[0.08]">
					<span className="text-[10px] font-[600] uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/[0.05] text-[#86868B]">
						{role}
					</span>
					<div className="avatar-glass w-7 h-7">
						<div className="avatar-glass-inner text-[10px] bg-gradient-to-tr from-[#6D28D9] to-[#FF2D55]">
							{user?.name?.slice(0, 2).toUpperCase() || "ME"}
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};
