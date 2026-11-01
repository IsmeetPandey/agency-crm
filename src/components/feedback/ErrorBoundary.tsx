import { Component, type ErrorInfo, type ReactNode } from "react";

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
				<div className="flex min-h-screen w-full items-center justify-center p-6 bg-[#F8F8F8] text-[#222222]">
					<div className="studio-modal max-w-lg w-full p-8 text-center space-y-4 shadow-xl border border-[#DEDEDE] bg-white rounded-xl">
						<div className="w-12 h-12 rounded-xl bg-[#FFF0F0] text-[#C62828] border border-[#F8C2C2] flex items-center justify-center text-[22px] mx-auto shadow-2xs">
							⚠
						</div>

						<div className="space-y-1">
							<h2 className="text-[18px] font-bold text-[#111111] tracking-tight">
								AgencyOS Encountered an Interruption
							</h2>
							<p className="text-[13px] text-[#666666] max-w-md mx-auto">
								A presentation exception occurred. Your local agency business
								records are protected and safe.
							</p>
						</div>

						{this.state.error && (
							<div className="p-3 rounded-lg bg-[#F8F8F8] border border-[#DEDEDE] text-left font-mono text-[11px] text-[#C62828] overflow-x-auto max-h-36">
								{this.state.error.toString()}
							</div>
						)}

						<div className="flex items-center justify-center gap-3 pt-2">
							<button
								type="button"
								onClick={this.handleReset}
								className="btn-primary !h-[36px] !px-5 text-[13px]"
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
								className="btn-secondary !h-[36px] !px-4 text-[13px]"
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
