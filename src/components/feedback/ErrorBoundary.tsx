import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
		errorInfo: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error, errorInfo: null };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Uncaught runtime error in AgencyOS:", error, errorInfo);
		this.setState({ errorInfo });
	}

	private handleReset = () => {
		this.setState({ hasError: false, error: null, errorInfo: null });
		window.location.reload();
	};

	public render() {
		if (this.state.hasError) {
			return (
				<div className="flex min-h-screen w-full items-center justify-center p-6 tahoe-bg text-[#1D1D1F]">
					<div className="liquid-modal max-w-lg w-full p-8 text-center space-y-4 shadow-2xl">
						<div className="w-12 h-12 rounded-2xl bg-[#FF2D55]/10 text-[#FF2D55] border border-[#FF2D55]/20 flex items-center justify-center text-[22px] mx-auto shadow-inner">
							⚠
						</div>

						<div className="space-y-1">
							<h2 className="text-[18px] font-[700] text-[#1D1D1F] tracking-[-0.015em]">
								AgencyOS Encountered an Interruption
							</h2>
							<p className="text-[13px] text-[#86868B] max-w-md mx-auto">
								A presentation exception occurred. Your local agency business
								records are protected and safe.
							</p>
						</div>

						{this.state.error && (
							<div className="p-3 rounded-[10px] bg-black/[0.04] border border-black/[0.08] text-left font-mono text-[11px] text-[#FF2D55] overflow-x-auto max-h-36">
								{this.state.error.toString()}
							</div>
						)}

						<div className="flex items-center justify-center gap-3 pt-2">
							<button
								type="button"
								onClick={this.handleReset}
								className="btn-liquid btn-liquid-primary !h-[36px] !px-5 text-[13px]"
							>
								Reload Workspace
							</button>
							<button
								type="button"
								onClick={() => {
									this.setState({
										hasError: false,
										error: null,
										errorInfo: null,
									});
								}}
								className="btn-liquid !h-[36px] !px-4 text-[13px]"
							>
								Try Dismissing
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
