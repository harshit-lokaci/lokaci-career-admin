"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiAddLine, RiMenuLine, RiSparklingLine } from "react-icons/ri";

export default function Header({ onOpenMobileMenu }) {
	const pathname = usePathname();

	const getPageTitle = () => {
		if (pathname === "/") return "Overview & Analytics";
		if (pathname === "/jobs/new") return "Post Job Opening";
		if (pathname.startsWith("/jobs")) return "Job Openings";
		if (pathname.startsWith("/applications")) return "Candidate Applications";
		if (pathname.startsWith("/settings")) return "Settings & Configuration";
		return "Admin Portal";
	};

	return (
		<header className="h-16 px-3.5 sm:px-6 md:px-8 bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-30 flex items-center justify-between gap-2">
			<div className="flex items-center gap-2 sm:gap-3 min-w-0">
				<button
					type="button"
					onClick={onOpenMobileMenu}
					className="md:hidden p-2 -ml-1 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100 cursor-pointer shrink-0"
					aria-label="Open navigation menu"
				>
					<RiMenuLine size={20} />
				</button>

				<div className="min-w-0">
					<h1 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 tracking-tight truncate max-w-[150px] sm:max-w-none">
						{getPageTitle()}
					</h1>
					<p className="text-[11px] text-gray-400 hidden sm:block">
						Lokaci Careers Admin
					</p>
				</div>
			</div>

			<div className="flex items-center gap-2 shrink-0">
				{/* Post Job Button */}
				<Link
					href="/jobs/new"
					className="inline-flex items-center gap-1.5 bg-black text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98] shrink-0"
				>
					<RiAddLine size={16} />
					<span>Post Job</span>
				</Link>
			</div>
		</header>
	);
}
