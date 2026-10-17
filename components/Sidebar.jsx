"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	RiBriefcaseLine,
	RiCloseLine,
	RiDashboardLine,
	RiExternalLinkLine,
	RiLogoutBoxRLine,
	RiSettings4Line,
	RiUserSearchLine,
} from "react-icons/ri";
import { careerStore } from "@/lib/careerStore";

const navItems = [
	{
		label: "Dashboard",
		href: "/",
		icon: <RiDashboardLine size={19} />,
	},
	{
		label: "Job Openings",
		href: "/jobs",
		icon: <RiBriefcaseLine size={19} />,
	},
	{
		label: "Applications",
		href: "/applications",
		icon: <RiUserSearchLine size={19} />,
	},
];

export default function Sidebar({ isOpen, onClose }) {
	const pathname = usePathname();
	const router = useRouter();

	const handleLogout = () => {
		careerStore.logout();
		router.replace("/login");
	};

	const session = careerStore.getCurrentSession();
	const userName = session?.user?.name || "HR Admin";
	const userEmail = session?.user?.email || "admin@lokaci.com";

	return (
		<>
			{/* Mobile Backdrop */}
			{isOpen && (
				<div
					onClick={onClose}
					className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
				/>
			)}

			{/* Sidebar Panel */}
			<aside
				className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200/80 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div>
					{/* Logo & Header */}
					<div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between">
						<Link href="/" className="flex items-center gap-2.5">
							<img
								src="/logo.png"
								alt="Lokaci"
								className="h-5 w-auto"
							/>
							<span className="text-[11px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-black text-white">
								Careers
							</span>
						</Link>

						<button
							type="button"
							onClick={onClose}
							className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-black cursor-pointer"
						>
							<RiCloseLine size={20} />
						</button>
					</div>

					{/* Navigation Links */}
					<nav className="p-4 space-y-1">
						{navItems.map((item) => {
							const isActive =
								item.href === "/"
									? pathname === "/"
									: pathname.startsWith(item.href);

							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={onClose}
									className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
										isActive
											? "bg-black text-white shadow-xs"
											: "text-gray-600 hover:text-black hover:bg-gray-100"
									}`}
								>
									<span
										className={
											isActive
												? "text-white"
												: "text-gray-400"
										}
									>
										{item.icon}
									</span>
									<span>{item.label}</span>
								</Link>
							);
						})}
					</nav>

					{/* Public Website Shortcut */}
					<div className="px-4 mt-4">
						<a
							href={
								process.env.NEXT_PUBLIC_CAREER_SITE_URL ||
								"https://lokaci.com/career/openings"
							}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F7] text-xs font-semibold text-gray-700 hover:border-black transition-colors"
						>
							<span>Live Career Page</span>
							<RiExternalLinkLine size={14} className="text-gray-400" />
						</a>
					</div>
				</div>

				{/* Bottom User Profile & Logout */}
				<div className="p-4 border-t border-gray-100">
					<div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
						<div className="flex items-center gap-2.5 min-w-0">
							<div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
								{userName.charAt(0)}
							</div>
							<div className="min-w-0">
								<p className="text-xs font-semibold text-gray-900 truncate">
									{userName}
								</p>
								<p className="text-[10px] text-gray-500 truncate">
									{userEmail}
								</p>
							</div>
						</div>

						<button
							type="button"
							onClick={handleLogout}
							title="Sign Out"
							className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
						>
							<RiLogoutBoxRLine size={18} />
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
