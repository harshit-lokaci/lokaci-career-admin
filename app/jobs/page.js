"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
	RiAddLine,
	RiBriefcaseLine,
	RiCheckLine,
	RiDeleteBinLine,
	RiEditLine,
	RiFileCopyLine,
	RiSearchLine,
} from "react-icons/ri";
import AuthGuard from "@/components/AuthGuard";
import { careerStore } from "@/lib/careerStore";

function JobsContent() {
	const [jobs, setJobs] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
	const [copiedJobId, setCopiedJobId] = useState(null);

	const handleCopyJobLink = async (jobId) => {
		const baseUrl =
			process.env.NEXT_PUBLIC_CAREER_SITE_URL ||
			"https://lokaci.com";
		const fullUrl = `${baseUrl.replace(/\/$/, "")}/career/openings/${jobId}`;
		try {
			await navigator.clipboard.writeText(fullUrl);
			setCopiedJobId(jobId);
			setTimeout(() => {
				setCopiedJobId(null);
			}, 2000);
		} catch (err) {
			console.error("Failed to copy public link:", err);
		}
	};

	const reloadJobs = async () => {
		try {
			setIsLoading(true);
			const res = await fetch("/api/jobs");
			const json = await res.json();
			if (json.success && Array.isArray(json.data)) {
				setJobs(json.data);
				careerStore.saveJobs(json.data);
			} else {
				setJobs(careerStore.getJobs());
			}
		} catch (err) {
			console.warn("Falling back to local cache:", err);
			setJobs(careerStore.getJobs());
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		reloadJobs();
	}, []);

	const handleToggleStatus = async (id, currentStatus) => {
		const newStatus = currentStatus === "active" ? "inactive" : "active";
		// Optimistic UI update
		setJobs((prev) =>
			prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j))
		);

		try {
			await fetch(`/api/jobs/${id}`, {
				method: "PATCH",
				headers: careerStore.getAuthHeaders({ "Content-Type": "application/json" }),
				body: JSON.stringify({ status: newStatus }),
			});
		} catch (err) {
			console.error("Failed to toggle status on server:", err);
			reloadJobs();
		}
	};

	const handleDeleteJob = async (id, title) => {
		if (
			confirm(
				`Are you sure you want to delete "${title}"? This will permanently remove the role from AWS RDS PostgreSQL.`
			)
		) {
			setJobs((prev) => prev.filter((j) => j.id !== id));
			try {
				await fetch(`/api/jobs/${id}`, {
					method: "DELETE",
					headers: careerStore.getAuthHeaders(),
				});
			} catch (err) {
				console.error("Failed to delete job on server:", err);
				reloadJobs();
			}
		}
	};

	// Filtered jobs
	const filteredJobs = jobs.filter((job) => {
		const matchesSearch =
			job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(job.department || "")
				.toLowerCase()
				.includes(searchQuery.toLowerCase());

		const matchesStatus =
			statusFilter === "all" ? true : job.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	return (
		<AuthGuard>
			<div className="space-y-6">
				{/* Top Actions Row */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
					<div>
						<h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
							Job Openings ({filteredJobs.length})
						</h2>
						<p className="text-xs text-gray-500 mt-0.5">
							Live positions connected directly to AWS RDS PostgreSQL
						</p>
					</div>

					{/* Dedicated Page Link - No Popup */}
					<Link
						href="/jobs/new"
						className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-all shadow-xs cursor-pointer"
					>
						<RiAddLine size={16} />
						<span>Post New Role</span>
					</Link>
				</div>

				{/* Search & Status Filters */}
				<div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
					{/* Search */}
					<div className="relative w-full md:w-80">
						<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
							<RiSearchLine size={16} />
						</span>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by role, location..."
							className="w-full pl-9 pr-4 py-2 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none transition-colors"
						/>
					</div>

					{/* Filter Pills */}
					<div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
						{[
							{ id: "all", label: "All Roles" },
							{ id: "active", label: "Active" },
							{ id: "inactive", label: "Inactive / Draft" },
						].map((tab) => (
							<button
								key={tab.id}
								type="button"
								onClick={() => setStatusFilter(tab.id)}
								className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
									statusFilter === tab.id
										? "bg-black text-white"
										: "bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				{/* Jobs List / Table */}
				<div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
					{isLoading && jobs.length === 0 ? (
						<div className="p-12 text-center text-gray-400">
							<div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
							<p className="text-xs font-medium text-gray-500">
								Loading live jobs from PostgreSQL...
							</p>
						</div>
					) : filteredJobs.length === 0 ? (
						<div className="p-12 text-center text-gray-400">
							<RiBriefcaseLine
								size={36}
								className="mx-auto mb-2 opacity-40"
							/>
							<p className="text-sm font-semibold text-gray-600">
								No job openings found
							</p>
							<p className="text-xs text-gray-400 mt-1">
								Try adjusting your search or click &ldquo;Post New Role&rdquo;.
							</p>
						</div>
					) : (
						<>
							{/* Mobile Card List (< md) */}
							<div className="md:hidden divide-y divide-gray-100">
								{filteredJobs.map((job) => {
									const applicantsCount =
										job.applicationsCount !== undefined
											? job.applicationsCount
											: 0;
									const isActive = job.status === "active";

									return (
										<div key={job.id} className="p-4 space-y-3">
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0 flex-1">
													<h3 className="font-bold text-sm text-gray-900 break-words">
														{job.title}
													</h3>
													<div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 flex-wrap">
														<span>{job.location}</span>
														<span>•</span>
														<span>{job.department || "General"}</span>
														<span>•</span>
														<span>{job.type}</span>
													</div>
												</div>
												<button
													type="button"
													onClick={() =>
														handleToggleStatus(job.id, job.status)
													}
													className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer shrink-0 ${
														isActive
															? "bg-emerald-50 text-emerald-700 border-emerald-200"
															: "bg-gray-100 text-gray-600 border-gray-200"
													}`}
												>
													<span
														className={`w-1.5 h-1.5 rounded-full ${
															isActive
																? "bg-emerald-500"
																: "bg-gray-400"
														}`}
													/>
													<span>{isActive ? "Active" : "Inactive"}</span>
												</button>
											</div>

											<div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
												<div className="flex items-center gap-2">
													<Link
														href={`/applications?jobId=${job.id}`}
														className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F5F5F7] text-gray-800 hover:bg-gray-200 transition-colors"
													>
														{applicantsCount} Applied
													</Link>
													<span className="text-[11px] text-gray-400">
														{job.experience || "Fresher/Any"}
													</span>
												</div>

												<div className="flex items-center gap-1">
													<button
														type="button"
														onClick={() => handleCopyJobLink(job.id)}
														className={`p-2 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer ${
															copiedJobId === job.id
																? "text-emerald-600 bg-emerald-50"
																: "text-gray-500 hover:text-black hover:bg-gray-100"
														}`}
														title={
															copiedJobId === job.id
																? "Link copied!"
																: "Copy Public Job Link"
														}
													>
														{copiedJobId === job.id ? (
															<RiCheckLine size={16} className="text-emerald-600" />
														) : (
															<RiFileCopyLine size={16} />
														)}
													</button>
													<Link
														href={`/jobs/new?id=${job.id}`}
														className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
														title="Edit Job"
													>
														<RiEditLine size={16} />
													</Link>
													<button
														type="button"
														onClick={() =>
															handleDeleteJob(job.id, job.title)
														}
														className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
														title="Delete Job"
													>
														<RiDeleteBinLine size={16} />
													</button>
												</div>
											</div>
										</div>
									);
								})}
							</div>

							{/* Desktop Table View (>= md) */}
							<div className="hidden md:block overflow-x-auto">
								<table className="w-full text-left">
									<thead>
										<tr className="bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200/80">
											<th className="py-3.5 px-6 font-semibold">
												Job Title
											</th>
											<th className="py-3.5 px-4 font-semibold">
												Location & Dept
											</th>
											<th className="py-3.5 px-4 font-semibold">
												Experience
											</th>
											<th className="py-3.5 px-4 font-semibold">
												Status (Toggle)
											</th>
											<th className="py-3.5 px-4 font-semibold">
												Applicants
											</th>
											<th className="py-3.5 px-6 text-right font-semibold">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-100 text-sm">
										{filteredJobs.map((job) => {
											const applicantsCount =
												job.applicationsCount !== undefined
													? job.applicationsCount
													: 0;
											const isActive = job.status === "active";

											return (
												<tr
													key={job.id}
													className="hover:bg-gray-50/50 transition-colors"
												>
													<td className="py-4 px-6">
														<div className="font-bold text-gray-900">
															{job.title}
														</div>
														<div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
															<span>{job.type}</span>
															<span>•</span>
															<span>
																{Array.isArray(job.screeningQuestions)
																	? job.screeningQuestions.length
																	: 0}{" "}
																Screening Qs
															</span>
														</div>
													</td>

													<td className="py-4 px-4">
														<div className="text-xs font-semibold text-gray-800">
															{job.location}
														</div>
														<div className="text-[11px] text-gray-400">
															{job.department || "General"}
														</div>
													</td>

													<td className="py-4 px-4 text-xs text-gray-600">
														{job.experience || "Not specified"}
													</td>

													{/* Active / Inactive Toggle */}
													<td className="py-4 px-4">
														<button
															type="button"
															onClick={() =>
																handleToggleStatus(job.id, job.status)
															}
															title="Click to toggle Active / Inactive in PostgreSQL"
															className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
																isActive
																	? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
																	: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
															}`}
														>
															<span
																className={`w-2 h-2 rounded-full ${
																	isActive
																		? "bg-emerald-500"
																		: "bg-gray-400"
																}`}
															/>
															<span>
																{isActive ? "Active" : "Inactive"}
															</span>
														</button>
													</td>

													<td className="py-4 px-4">
														<Link
															href={`/applications?jobId=${job.id}`}
															title="View applications for this role"
															className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F5F7] text-gray-800 hover:bg-gray-200 transition-colors"
														>
															{applicantsCount} Applied
														</Link>
													</td>

													<td className="py-4 px-6 text-right">
														<div className="inline-flex items-center gap-1.5">
															{/* Copy Public Link Button */}
															<button
																type="button"
																onClick={() => handleCopyJobLink(job.id)}
																className={`p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center gap-1 text-xs font-semibold ${
																	copiedJobId === job.id
																		? "text-emerald-700 bg-emerald-50 border border-emerald-200"
																		: "text-gray-500 hover:text-black hover:bg-gray-100"
																}`}
																title={
																	copiedJobId === job.id
																		? "Copied to clipboard!"
																		: "Copy Public Job Link"
																}
															>
																{copiedJobId === job.id ? (
																	<>
																		<RiCheckLine size={15} className="text-emerald-600" />
																		<span className="text-[11px] text-emerald-700">Copied</span>
																	</>
																) : (
																	<RiFileCopyLine size={16} />
																)}
															</button>

															{/* Edit opens dedicated page with ?id= */}
															<Link
																href={`/jobs/new?id=${job.id}`}
																className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
																title="Edit Job on Full Page"
															>
																<RiEditLine size={16} />
															</Link>

															<button
																type="button"
																onClick={() =>
																	handleDeleteJob(job.id, job.title)
																}
																className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
																title="Delete Job"
															>
																<RiDeleteBinLine size={16} />
															</button>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</>
					)}
				</div>
			</div>
		</AuthGuard>
	);
}

export default function JobsPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-[400px] flex items-center justify-center">
					<div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
				</div>
			}
		>
			<JobsContent />
		</Suspense>
	);
}
