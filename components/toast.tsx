"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
	id: string;
	message: string;
	type: ToastType;
};

const ToastContext = createContext<{
	toast: (message: string, type?: ToastType) => void;
}>({ toast: () => {} });

export function useToast() {
	return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const addToast = useCallback((message: string, type: ToastType = "info") => {
		const id = Math.random().toString(36).slice(2);
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	}, []);

	const removeToast = (id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	return (
		<ToastContext.Provider value={{ toast: addToast }}>
			{children}
			<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
				{toasts.map((t) => (
					<div
						key={t.id}
						className="flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm animate-in slide-in-from-right"
						style={{
							backgroundColor: "white",
							borderColor: "var(--brand-ink-30)",
						}}
					>
						{t.type === "success" && (
							<CheckCircle2 size={18} style={{ color: "var(--brand-verified-green)", flexShrink: 0 }} />
						)}
						{t.type === "error" && (
							<AlertCircle size={18} style={{ color: "var(--brand-brick)", flexShrink: 0 }} />
						)}
						{t.type === "info" && (
							<Info size={18} style={{ color: "var(--brand-seal-gold)", flexShrink: 0 }} />
						)}
						<p className="flex-1" style={{ color: "var(--brand-ink)" }}>
							{t.message}
						</p>
						<button
							type="button"
							onClick={() => removeToast(t.id)}
							className="p-0.5 hover:opacity-70"
						>
							<X size={14} style={{ color: "var(--brand-ink-60)" }} />
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}
