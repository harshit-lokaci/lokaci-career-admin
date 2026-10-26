"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
	RiAddLine,
	RiArrowRightLine,
	RiBriefcaseLine,
	RiCheckLine,
	RiTimeLine,
	RiUserSearchLine,
	RiUserVoiceLine,
} from "react-icons/ri";
import AuthGuard from "@/components/AuthGuard";
import { careerStore } from "@/lib/careerStore";

export default function DashboardPage() {
	const [analytics, setAnalytics] = useState(null);
	const [recentApps, setRecentApps] = useState([]);
	const [activeJobsList, setActiveJobsList] = useState([]);

	useEffect(() => {
		async function loadDashboard() {
			try {
				const [jobsRes, appsRes] = await Promise.all([
					fetch("/api/jobs"),
					fetch("/api/applications", {
						headers: careerStore.getAuthHeaders(),
					}),
				]);
				if (appsRes.status === 401) {
					careerStore.logout();
					if (typeof window !== "undefined") {
						window.location.replace("/login");
					}
					return;
				}

				const [jobsJson, appsJson] = await Promise.all([
					jobsRes.json(),
					appsRes.json(),
				]);

				const allJobs = jobsJson.success ? jobsJson.data : careerStore.getJobs();
				const allApps = appsJson.success ? appsJson.data : careerStore.getApplications();

				const totalJobs = allJobs.length;
				const activeJobs = allJobs.filter((j) => j.status === "active").length;
				const inactiveJobs = totalJobs - activeJobs;
				const totalApplications = allApps.length;
				const shortlisted = allApps.filter((a) => a.status === "shortlisted").length;
				const inInterview = allApps.filter((a) => a.status === "interview").length;
				const underReview = allApps.filter(
					(a) =>
						a.status === "new" ||
						a.status === "reviewed" ||
						a.status === "applied"
				).length;
				const rejected = allApps.filter((a) => a.status === "rejected").length;
				const today = new Date().toISOString().split("T")[0];
				const todayCount = allApps.filter((a) =>
					(a.appliedAt || "").startsWith(today)
				).length;

				setAnalytics({
					totalJobs,
					activeJobs,
					inactiveJobs,
					totalApplications,
					shortlisted,
					inInterview,
					underReview,
					rejected,
					todayCount,
				});
				setRecentApps(allApps.slice(0, 5));
				setActiveJobsList(allJobs.filter((j) => j.status === "active").slice(0, 4));
			} catch {
				const data = careerStore.getAnalytics();
				setAnalytics(data);
				const allApps = careerStore.getApplications();
				setRecentApps(allApps.slice(0, 5));
				const allJobs = careerStore.getJobs();
				setActiveJobsList(allJobs.filter((j) => j.status === "active").slice(0, 4));
			}
		}
		loadDashboard();
	}, []);

	if (!analytics) return null;

	const getStatusBadge = (status) => {
		switch (status) {
			case "shortlisted":
				return (
					<span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
						Shortlisted
					</span>
				);
			case "interview":
				return (
					<span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
						Interview
					</span>
				);
			case "rejected":
				return (
					<span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
						Rejected
					</span>
				);
			default:
				return (
					<span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
						New Applied
					</span>
				);
		}
	};

	return (
		<AuthGuard>
			<div className="space-y-8">
				{/* Top Welcome Banner */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs">
					<div>
						<span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
							Lokaci Careers
						</span>
						<h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
							Welcome to Hiring Dashboard
						</h2>
						<p className="text-xs text-gray-500 mt-1">
							Monitor open positions, track applicants, and review screening responses.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<Link
							href="/jobs/new"
							className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold hover:bg-gray-800 transition-all shadow-xs cursor-pointer"
						>
							<RiAddLine size={16} />
							<span>Post New Job</span>
						</Link>
					</div>
				</div>

				{/* 4 Stat Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5">
					{/* Stat 1: Total Jobs */}
					<div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
								Job Openings
							</span>
							<div className="p-2 sm:p-2.5 bg-[#F5F5F7] rounded-xl text-black">
								<RiBriefcaseLine size={18} />
							</div>
						</div>
						<div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
							{analytics.totalJobs || 0}
						</div>
						<div className="flex items-center gap-2 text-xs text-gray-500">
							<span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
								{analytics.activeJobs || 0} Active
							</span>
							<span>•</span>
							<span>{analytics.inactiveJobs || 0} Inactive</span>
						</div>
					</div>

					{/* Stat 2: Total Applications */}
					<div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
								Total Applications
							</span>
							<div className="p-2 sm:p-2.5 bg-[#F5F5F7] rounded-xl text-black">
								<RiUserSearchLine size={18} />
							</div>
						</div>
						<div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
							{analytics.totalApplications || 0}
						</div>
						<p className="text-xs text-gray-500">
							Received via Lokaci Careers
						</p>
					</div>

					{/* Stat 3: Today Applications */}
					<div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
								Today&apos;s Activity
							</span>
							<div className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-xl">
								<RiTimeLine size={18} />
							</div>
						</div>
						<div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
							{analytics.todayCount || 0}
						</div>
						<p className="text-xs text-gray-500">
							New candidate responses today
						</p>
					</div>

					{/* Stat 4: Shortlisted / In-Interview */}
					<div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
								In Pipeline
							</span>
							<div className="p-2 sm:p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
								<RiUserVoiceLine size={18} />
							</div>
						</div>
						<div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
							{(analytics.shortlisted || 0) + (analytics.inInterview || 0)}
						</div>
						<div className="text-xs text-gray-500 flex items-center gap-2">
							<span>{analytics.shortlisted || 0} Shortlisted</span>
							<span>•</span>
							<span>{analytics.inInterview || 0} Interviews</span>
						</div>
					</div>
				</div>

				{/* Two Column Grid: Pipeline + Active Jobs */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
					{/* Left: Recent Applications Table (8 cols) */}
					<div className="lg:col-span-8 bg-white p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs">
						<div className="flex items-center justify-between mb-5 sm:mb-6 pb-3 border-b border-gray-100">
							<div>
								<h3 className="text-sm sm:text-base font-bold text-gray-900">
									Recent Applicants
								</h3>
								<p className="text-xs text-gray-400 mt-0.5">
									Latest candidate submissions with screening answers
								</p>
							</div>

							<Link
								href="/applications"
								className="text-xs font-semibold text-gray-900 hover:underline flex items-center gap-1 shrink-0"
							>
								<span>View All ({analytics.totalApplications})</span>
								<RiArrowRightLine size={12} />
							</Link>
						</div>

						{/* Mobile Card View for Applicants (< md) */}
						<div className="md:hidden space-y-3">
							{recentApps.length === 0 ? (
								<p className="text-xs text-gray-400 text-center py-4 italic">No recent applicants</p>
							) : (
								recentApps.map((app) => (
									<div
										key={app.id}
										className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-gray-100 space-y-2.5"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<div className="font-bold text-sm text-gray-900 truncate">
													{app.fullName}
												</div>
												<div className="text-[11px] text-gray-400 truncate">
													{app.email} • {app.phone}
												</div>
											</div>
											<div className="shrink-0">{getStatusBadge(app.status)}</div>
										</div>

										<div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200/50">
											<span className="font-medium text-gray-800 truncate max-w-[180px]">
												{app.jobTitle}
											</span>
											<Link
												href={`/applications?id=${app.id}`}
												className="font-semibold text-black hover:underline shrink-0"
											>
												Review →
											</Link>
										</div>
									</div>
								))
							)}
						</div>

						{/* Desktop Table View (>= md) */}
						<div className="hidden md:block overflow-x-auto">
							<table className="w-full text-left">
								<thead>
									<tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
										<th className="pb-3 font-semibold">Candidate</th>
										<th className="pb-3 font-semibold">Role</th>
										<th className="pb-3 font-semibold">Experience</th>
										<th className="pb-3 font-semibold">Status</th>
										<th className="pb-3 text-right font-semibold">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100 text-sm">
									{recentApps.map((app) => (
										<tr
											key={app.id}
											className="hover:bg-gray-50/70 transition-colors"
										>
											<td className="py-3.5 pr-4">
												<div className="font-semibold text-gray-900">
													{app.fullName}
												</div>
												<div className="text-xs text-gray-400">
													{app.email} • {app.phone}
												</div>
											</td>
											<td className="py-3.5 pr-4 text-xs font-medium text-gray-700">
												{app.jobTitle}
											</td>
											<td className="py-3.5 pr-4 text-xs text-gray-500">
												{app.experience}
											</td>
											<td className="py-3.5 pr-4">
												{getStatusBadge(app.status)}
											</td>
											<td className="py-3.5 text-right">
												<Link
													href={`/applications?id=${app.id}`}
													className="text-xs font-semibold text-black hover:underline"
												>
													Review →
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Right: Quick Active Openings list (4 cols) */}
					<div className="lg:col-span-4 bg-white p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
						<div>
							<div className="flex items-center justify-between mb-5 sm:mb-6 pb-3 border-b border-gray-100">
								<div>
									<h3 className="text-sm sm:text-base font-bold text-gray-900">
										Active Openings
									</h3>
									<p className="text-xs text-gray-400 mt-0.5">
										Live on lokaci.com
									</p>
								</div>
								<Link
									href="/jobs"
									className="text-xs font-semibold text-gray-900 hover:underline"
								>
									Manage
								</Link>
							</div>

							<div className="space-y-3">
								{activeJobsList.length === 0 ? (
									<p className="text-xs text-gray-400 text-center py-4 italic">No active openings live</p>
								) : (
									activeJobsList.map((job) => (
										<div
											key={job.id}
											className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-gray-100 flex items-center justify-between gap-2"
										>
											<div className="min-w-0 pr-2">
												<h4 className="text-xs font-bold text-gray-900 truncate">
													{job.title}
												</h4>
												<p className="text-[11px] text-gray-500 truncate">
													{job.location}
												</p>
											</div>
											<span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-800">
												Live
											</span>
										</div>
									))
								)}
							</div>
						</div>

						<div className="pt-5 mt-5 sm:pt-6 sm:mt-6 border-t border-gray-100">
							<Link
								href="/jobs/new"
								className="w-full flex items-center justify-center gap-2 py-3 bg-[#F5F5F7] hover:bg-gray-200 text-gray-900 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
							>
								<RiAddLine size={14} />
								<span>Create Another Role</span>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</AuthGuard>
	);
}
