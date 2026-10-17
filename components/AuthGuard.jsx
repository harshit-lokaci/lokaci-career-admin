"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { careerStore } from "@/lib/careerStore";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AuthGuard({ children }) {
	const router = useRouter();
	const pathname = usePathname();
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

	useEffect(() => {
		// If on login page, don't check
		if (pathname === "/login") {
			setIsLoading(false);
			return;
		}

		const session = careerStore.getCurrentSession();
		if (!session) {
			router.replace("/login");
		} else {
			setIsAuthenticated(true);
		}
		setIsLoading(false);
	}, [pathname, router]);

	if (pathname === "/login") {
		return <>{children}</>;
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
					<p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
						Loading Lokaci Hub...
					</p>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) return null;

	return (
		<div className="min-h-screen bg-[#FBFBFD] flex flex-col md:flex-row text-gray-900">
			{/* Desktop Sidebar */}
			<Sidebar
				isOpen={mobileSidebarOpen}
				onClose={() => setMobileSidebarOpen(false)}
			/>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col min-w-0">
				<Header onOpenMobileMenu={() => setMobileSidebarOpen(true)} />
				<main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
					{children}
				</main>
			</div>
		</div>
	);
}
