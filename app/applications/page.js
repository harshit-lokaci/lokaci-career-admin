"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
	RiBriefcaseLine,
	RiCheckLine,
	RiCloseLine,
	RiDeleteBinLine,
	RiDownloadLine,
	RiExternalLinkLine,
	RiFileTextLine,
	RiFilter3Line,
	RiGlobalLine,
	RiLinkedinBoxLine,
	RiMailLine,
	RiMapPinLine,
	RiPhoneLine,
	RiQuestionLine,
	RiSearchLine,
	RiTimeLine,
	RiUser3Line,
	RiWhatsappLine,
} from "react-icons/ri";
import AuthGuard from "@/components/AuthGuard";
import { careerStore } from "@/lib/careerStore";

function ApplicationsContent() {
	const searchParams = useSearchParams();
	const [applications, setApplications] = useState([]);
	const [jobs, setJobs] = useState([]);

	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	// Active candidate review drawer
	const [selectedCandidate, setSelectedCandidate] = useState(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const closeTimeoutRef = useRef(null);
	const [notesInput, setNotesInput] = useState("");
	const [isSavingNotes, setIsSavingNotes] = useState(false);
	const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

	const handleOpenCandidate = (candidate) => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}

		let city = candidate.city || candidate.currentLocation || "Not specified";
		let experience = candidate.experience || candidate.experienceYears || "Not specified";
		let noticePeriod = candidate.noticePeriod || "Not specified";
		let currentCtc = candidate.currentCtc || "N/A";
		let expectedCtc = candidate.expectedCtc || "N/A";
		let portfolioUrl = candidate.portfolioUrl || "";
		let linkedinUrl = candidate.linkedinUrl || "";

		// If notice/CTC/portfolio were encoded in coverNote (from earlier submissions)
		if (candidate.coverNote) {
			const parts = candidate.coverNote.split("|").map((p) => p.trim());
			for (const part of parts) {
				const colonIdx = part.indexOf(":");
				if (colonIdx === -1) continue;
				const key = part.slice(0, colonIdx).trim().toLowerCase();
				const val = part.slice(colonIdx + 1).trim();
				if (!val) continue;

				if (key.includes("notice") && (noticePeriod === "Not specified" || !noticePeriod)) {
					noticePeriod = val;
				} else if (key.includes("current ctc") && (currentCtc === "N/A" || !currentCtc)) {
					currentCtc = val;
				} else if (key.includes("expected ctc") && (expectedCtc === "N/A" || !expectedCtc)) {
					expectedCtc = val;
				} else if (key.includes("portfolio") && !portfolioUrl) {
					portfolioUrl = val;
				} else if (key.includes("linkedin") && !linkedinUrl) {
					linkedinUrl = val;
				}
			}
		}

		setSelectedCandidate({
			...candidate,
			city,
			experience,
			noticePeriod,
			currentCtc,
			expectedCtc,
			portfolioUrl,
			linkedinUrl,
		});
		setNotesInput(candidate.notes || "");
		setNotesSavedSuccess(false);

		// Trigger smooth entrance animation
		setTimeout(() => {
			setIsDrawerOpen(true);
		}, 15);
	};

	const reloadData = async () => {
		try {
			const [appsRes, jobsRes] = await Promise.all([
				fetch("/api/applications", {
					headers: careerStore.getAuthHeaders(),
				}),
				fetch("/api/jobs"),
			]);
			if (appsRes.status === 401) {
				careerStore.logout();
				if (typeof window !== "undefined") {
					window.location.replace("/login");
				}
				return;
			}

			const [appsJson, jobsJson] = await Promise.all([
				appsRes.json(),
				jobsRes.json(),
			]);

			let loadedApps = careerStore.getApplications();
			let loadedJobs = careerStore.getJobs();

			if (appsJson.success && Array.isArray(appsJson.data)) {
				loadedApps = appsJson.data;
				setApplications(appsJson.data);
				careerStore.saveApplications(appsJson.data);
			} else {
				setApplications(loadedApps);
			}

			if (jobsJson.success && Array.isArray(jobsJson.data)) {
				loadedJobs = jobsJson.data;
				setJobs(jobsJson.data);
				careerStore.saveJobs(jobsJson.data);
			} else {
				setJobs(loadedJobs);
			}

			const initialId = searchParams.get("id");
			if (initialId) {
				const found = loadedApps.find((a) => a.id === initialId);
				if (found) {
					handleOpenCandidate(found);
				}
			}
		} catch (err) {
			console.warn("Falling back to local applications store:", err);
			setApplications(careerStore.getApplications());
			setJobs(careerStore.getJobs());
		}
	};

	const candidateParamId = searchParams.get("id") || "";
	useEffect(() => {
		reloadData();
	}, [candidateParamId]);

	const handleCloseDrawer = () => {
		setIsDrawerOpen(false);
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
		}
		closeTimeoutRef.current = setTimeout(() => {
			setSelectedCandidate(null);
		}, 300);
	};

	// Close drawer on Escape key
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape" && isDrawerOpen) {
				handleCloseDrawer();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isDrawerOpen]);

	// Prevent background page scrolling while drawer is active
	useEffect(() => {
		if (isDrawerOpen) {
			const prevOverflow = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = prevOverflow;
			};
		}
	}, [isDrawerOpen]);

	// Cleanup closing timer on unmount
	useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

	const handleStatusChange = async (appId, newStatus) => {
		// Optimistic UI update
		setApplications((prev) =>
			prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
		);
		if (selectedCandidate && selectedCandidate.id === appId) {
			setSelectedCandidate((prev) => ({ ...prev, status: newStatus }));
		}
		careerStore.updateApplicationStatus(appId, newStatus);

		try {
			await fetch(`/api/applications/${appId}`, {
				method: "PATCH",
				headers: careerStore.getAuthHeaders({ "Content-Type": "application/json" }),
				body: JSON.stringify({ status: newStatus }),
			});
		} catch (err) {
			console.error("Failed to update status on server:", err);
			reloadData();
		}
	};

	const handleSaveNotes = async () => {
		if (!selectedCandidate) return;
		setIsSavingNotes(true);
		careerStore.updateApplicationNotes(selectedCandidate.id, notesInput);
		setSelectedCandidate((prev) => ({ ...prev, notes: notesInput }));

		try {
			await fetch(`/api/applications/${selectedCandidate.id}`, {
				method: "PATCH",
				headers: careerStore.getAuthHeaders({ "Content-Type": "application/json" }),
				body: JSON.stringify({ notes: notesInput }),
			});
			setNotesSavedSuccess(true);
			setTimeout(() => setNotesSavedSuccess(false), 3000);
		} catch (err) {
			console.error("Failed to save notes on server:", err);
		} finally {
			setIsSavingNotes(false);
		}
	};

	const handleDeleteApplication = async (appId, candidateName = "this candidate") => {
		if (
			!confirm(
				`Are you sure you want to permanently delete the application of "${candidateName}"? This action cannot be undone.`
			)
		) {
			return;
		}

		// Optimistic removal
		setApplications((prev) => prev.filter((a) => a.id !== appId));
		careerStore.deleteApplication(appId);

		if (selectedCandidate && selectedCandidate.id === appId) {
			handleCloseDrawer();
		}

		try {
			const res = await fetch(`/api/applications/${appId}`, {
				method: "DELETE",
				headers: careerStore.getAuthHeaders(),
			});
			if (!res.ok) {
				console.error("Failed to delete application on server");
				reloadData();
			}
		} catch (err) {
			console.error("Failed to delete application on server:", err);
			reloadData();
		}
	};

	const handleExportCSV = () => {
		if (!filteredApplications.length) {
			alert("No candidate applications to export.");
			return;
		}

		const headers = [
			"Candidate ID",
			"Applied Date",
			"Candidate Name",
			"Role Applied",
			"Status",
			"Email",
			"Phone",
			"City / Location",
			"Total Experience",
			"Notice Period",
			"Current CTC",
			"Expected CTC",
			"Resume Link",
			"LinkedIn",
			"Portfolio",
			"HR Notes",
		];

		const escapeCell = (val) => {
			if (val === null || val === undefined) return '""';
			const str = String(val).replace(/"/g, '""');
			return `"${str}"`;
		};

		const rows = filteredApplications.map((app) => [
			escapeCell(app.id),
			escapeCell((app.appliedAt || "").split("T")[0]),
			escapeCell(app.fullName),
			escapeCell(app.jobTitle || app.job?.title || "N/A"),
			escapeCell(app.status),
			escapeCell(app.email),
			escapeCell(app.phone),
			escapeCell(app.city || app.currentLocation || "N/A"),
			escapeCell(app.experience || app.experienceYears || "N/A"),
			escapeCell(app.noticePeriod || "N/A"),
			escapeCell(app.currentCtc || "N/A"),
			escapeCell(app.expectedCtc || "N/A"),
			escapeCell(app.resumeUrl || "N/A"),
			escapeCell(app.linkedinUrl || ""),
			escapeCell(app.portfolioUrl || ""),
			escapeCell(app.notes || ""),
		]);

		const csvContent =
			"\uFEFF" +
			[headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

		const blob = new Blob([csvContent], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		const dateStr = new Date().toISOString().split("T")[0];
		const filterSuffix =
			statusFilter !== "all" ? `_${statusFilter}` : "";
		link.setAttribute(
			"download",
			`lokaci_candidates${filterSuffix}_${dateStr}.csv`
		);
		link.setAttribute("href", url);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const getQuestionDetails = (qKey, idx) => {
		const jobQuestions =
			selectedCandidate?.job?.screeningQuestions ||
			jobs.find((j) => j.id === selectedCandidate?.jobId)?.screeningQuestions ||
			[];

		const matched = jobQuestions.find(
			(q) => q.id === qKey || q.question === qKey
		);

		if (matched?.question) {
			return {
				title: matched.question,
				type: matched.type || "text",
				required: matched.required || false,
			};
		}

		if (qKey.startsWith("q_")) {
			return {
				title: `Screening Question ${idx + 1}`,
				type: "text",
				required: false,
			};
		}

		return {
			title: qKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
			type: "text",
			required: false,
		};
	};

	// Filters
	const filteredApplications = applications.filter((app) => {
		const matchesSearch =
			app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			app.phone.includes(searchQuery) ||
			(app.city || "").toLowerCase().includes(searchQuery.toLowerCase());

		const matchesRole = roleFilter === "all" ? true : app.jobId === roleFilter;
		const matchesStatus =
			statusFilter === "all" ? true : app.status === statusFilter;

		return matchesSearch && matchesRole && matchesStatus;
	});

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
			<div className="space-y-6">
				{/* Top Actions Row */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
							Candidate Applications ({filteredApplications.length})
						</h2>
						<p className="text-xs text-gray-500 mt-0.5">
							Submissions received directly from Lokaci career portal
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2.5">
						<button
							type="button"
							onClick={handleExportCSV}
							disabled={filteredApplications.length === 0}
							className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
							title="Export currently filtered candidates to Excel / CSV"
						>
							<RiDownloadLine size={15} />
							<span>Export CSV ({filteredApplications.length})</span>
						</button>
						<span className="text-xs text-gray-500 pl-1 border-l border-gray-200">
							Total: <strong>{applications.length}</strong>
						</span>
					</div>
				</div>

				{/* Search & Filter Bar */}
				<div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
					{/* Search */}
					<div className="relative w-full lg:w-80">
						<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
							<RiSearchLine size={16} />
						</span>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by name, email, phone..."
							className="w-full pl-9 pr-4 py-2.5 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-sm text-gray-900 focus:outline-none transition-colors"
						/>
					</div>

					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
						{/* Role Filter */}
						<select
							value={roleFilter}
							onChange={(e) => setRoleFilter(e.target.value)}
							className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold bg-white text-gray-800 focus:outline-none cursor-pointer"
						>
							<option value="all">All Roles</option>
							{jobs.map((j) => (
								<option key={j.id} value={j.id}>
									{j.title}
								</option>
							))}
						</select>

						{/* Status Filter */}
						<div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
							{[
								{ id: "all", label: "All" },
								{ id: "applied", label: "New" },
								{ id: "shortlisted", label: "Shortlisted" },
								{ id: "interview", label: "Interview" },
								{ id: "rejected", label: "Rejected" },
							].map((tab) => (
								<button
									key={tab.id}
									type="button"
									onClick={() => setStatusFilter(tab.id)}
									className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
										statusFilter === tab.id
											? "bg-black text-white shadow-xs"
											: "bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200"
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Applications Table */}
				<div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
					{filteredApplications.length === 0 ? (
						<div className="p-8 sm:p-12 text-center text-gray-400">
							<RiUser3Line size={36} className="mx-auto mb-2 opacity-40" />
							<p className="text-sm font-semibold text-gray-600">
								No candidate applications match this filter
							</p>
							<p className="text-xs text-gray-400 mt-1">
								Try resetting your search query or role filter.
							</p>
						</div>
					) : (
						<>
							{/* Mobile Card View (md:hidden) */}
							<div className="divide-y divide-gray-100 md:hidden">
								{filteredApplications.map((app) => (
									<div
										key={app.id}
										onClick={() => handleOpenCandidate(app)}
										className="p-4 hover:bg-gray-50/70 active:bg-gray-100 transition-colors cursor-pointer space-y-3"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<h4 className="font-bold text-gray-900 text-base leading-snug truncate">
													{app.fullName}
												</h4>
												<p className="text-xs text-gray-500 truncate mt-0.5">
													{app.email} • {app.phone}
												</p>
											</div>
											<div className="shrink-0">
												{getStatusBadge(app.status)}
											</div>
										</div>

										<div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
											<span className="font-medium bg-gray-100 px-2 py-0.5 rounded-md text-gray-800">
												{app.jobTitle}
											</span>
											<span>•</span>
											<span>{app.city || "N/A"}</span>
											<span>•</span>
											<span className="text-gray-400">{app.experience}</span>
										</div>

										<div className="flex items-center justify-between pt-1 border-t border-gray-100/80 text-xs">
											<span className="text-gray-400">
												Applied: {(app.appliedAt || "").split("T")[0]}
											</span>
											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteApplication(app.id, app.fullName);
													}}
													className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
													title="Delete candidate application"
												>
													<RiDeleteBinLine size={16} />
												</button>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleOpenCandidate(app);
													}}
													className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
												>
													Review Candidate →
												</button>
											</div>
										</div>
									</div>
								))}
							</div>

							{/* Desktop Table View (hidden md:block) */}
							<div className="hidden md:block overflow-x-auto">
								<table className="w-full text-left">
									<thead>
										<tr className="bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200/80">
											<th className="py-3.5 px-6 font-semibold">Candidate</th>
											<th className="py-3.5 px-4 font-semibold">Applied Role</th>
											<th className="py-3.5 px-4 font-semibold">City & Exp</th>
											<th className="py-3.5 px-4 font-semibold">Status</th>
											<th className="py-3.5 px-4 font-semibold">Date</th>
											<th className="py-3.5 px-6 text-right font-semibold">Review</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-100 text-sm">
										{filteredApplications.map((app) => (
											<tr
												key={app.id}
												onClick={() => handleOpenCandidate(app)}
												className="hover:bg-gray-50/70 transition-colors cursor-pointer"
											>
												<td className="py-4 px-6">
													<div className="font-bold text-gray-900">
														{app.fullName}
													</div>
													<div className="text-xs text-gray-400">
														{app.email} • {app.phone}
													</div>
												</td>

												<td className="py-4 px-4">
													<span className="text-xs font-semibold text-gray-800">
														{app.jobTitle}
													</span>
												</td>

												<td className="py-4 px-4 text-xs text-gray-600">
													<div>{app.city || "N/A"}</div>
													<div className="text-[11px] text-gray-400">
														{app.experience}
													</div>
												</td>

												<td className="py-4 px-4">
													{getStatusBadge(app.status)}
												</td>

												<td className="py-4 px-4 text-xs text-gray-400">
													{(app.appliedAt || "").split("T")[0]}
												</td>

												<td className="py-4 px-6 text-right">
													<div className="inline-flex items-center gap-1.5">
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																handleOpenCandidate(app);
															}}
															className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-black hover:text-white text-xs font-semibold text-gray-800 transition-colors cursor-pointer"
														>
															Review
														</button>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																handleDeleteApplication(app.id, app.fullName);
															}}
															className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
															title="Delete candidate application"
														>
															<RiDeleteBinLine size={16} />
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</>
					)}
				</div>
			</div>

			{/* ================= CANDIDATE REVIEW DRAWER ================= */}
			{selectedCandidate && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-end overflow-hidden"
					role="dialog"
					aria-modal="true"
					aria-labelledby="drawer-candidate-name"
				>
					{/* Backdrop */}
					<div
						onClick={handleCloseDrawer}
						className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-out cursor-pointer ${
							isDrawerOpen ? "opacity-100" : "opacity-0"
						}`}
					/>

					{/* Sliding Panel */}
					<div
						className={`relative w-full max-w-full sm:max-w-xl h-full bg-white shadow-2xl border-l border-gray-200 z-10 flex flex-col overflow-hidden will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
							isDrawerOpen ? "translate-x-0" : "translate-x-full"
						}`}
					>
						{/* Drawer Top Header */}
						<div className="p-4 sm:p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/80 backdrop-blur-sm sticky top-0 z-20">
							<div className="min-w-0 pr-2">
								<div className="flex items-center gap-2 mb-1.5">
									{getStatusBadge(selectedCandidate.status)}
									<span className="text-xs text-gray-400">
										Applied on{" "}
										{(selectedCandidate.appliedAt || "").split("T")[0]}
									</span>
								</div>
								<h3 id="drawer-candidate-name" className="text-lg sm:text-xl font-bold text-gray-900 truncate">
									{selectedCandidate.fullName}
								</h3>
								<p className="text-xs font-semibold text-gray-600 truncate mt-0.5">
									Applying for: {selectedCandidate.jobTitle}
								</p>
							</div>

							<div className="flex items-center gap-1 shrink-0">
								<button
									type="button"
									onClick={() =>
										handleDeleteApplication(
											selectedCandidate.id,
											selectedCandidate.fullName
										)
									}
									className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
									title="Delete this candidate application"
								>
									<RiDeleteBinLine size={19} />
								</button>
								<button
									type="button"
									onClick={handleCloseDrawer}
									className="p-2 -mr-1 text-gray-400 hover:text-black hover:bg-gray-200/60 rounded-xl transition-all cursor-pointer"
									title="Close drawer"
								>
									<RiCloseLine size={22} />
								</button>
							</div>
						</div>

						{/* Drawer Scrollable Content */}
						<div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 text-sm">
							{/* Quick Status Bar */}
							<div className="p-3 sm:p-3.5 rounded-2xl bg-[#F5F5F7] border border-gray-200/60">
								<span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
									Change Pipeline Stage
								</span>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
									{[
										{ id: "applied", label: "New" },
										{ id: "shortlisted", label: "Shortlist" },
										{ id: "interview", label: "Interview" },
										{ id: "rejected", label: "Reject" },
									].map((st) => (
										<button
											key={st.id}
											type="button"
											onClick={() =>
												handleStatusChange(
													selectedCandidate.id,
													st.id
												)
											}
											className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
												selectedCandidate.status === st.id
													? "bg-black text-white shadow-xs"
													: "bg-white text-gray-700 border border-gray-200 hover:border-black"
											}`}
										>
											{st.label}
										</button>
									))}
								</div>
							</div>

							{/* Direct Candidate Actions (WhatsApp, Phone, Email) */}
							<div>
								<span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
									Quick Actions
								</span>
								<div className="grid grid-cols-3 gap-2">
									<a
										href={`https://wa.me/${(selectedCandidate.phone || "").replace(/[^0-9]/g, "")}`}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-colors"
									>
										<RiWhatsappLine size={15} />
										<span>WhatsApp</span>
									</a>

									<a
										href={`tel:${selectedCandidate.phone}`}
										className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
									>
										<RiPhoneLine size={14} />
										<span>Call</span>
									</a>

									<a
										href={`mailto:${selectedCandidate.email}`}
										className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
									>
										<RiMailLine size={14} />
										<span>Email</span>
									</a>
								</div>
							</div>

							{/* Contact Information */}
							<div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 pb-1 border-b border-gray-100">
									Contact Details
								</h4>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
									<div className="flex items-center gap-2 text-gray-700 min-w-0">
										<RiMailLine className="text-gray-400 shrink-0" size={14} />
										<a
											href={`mailto:${selectedCandidate.email}`}
											className="hover:underline truncate"
										>
											{selectedCandidate.email}
										</a>
									</div>
									<div className="flex items-center gap-2 text-gray-700 min-w-0">
										<RiPhoneLine className="text-gray-400 shrink-0" size={14} />
										<a
											href={`tel:${selectedCandidate.phone}`}
											className="hover:underline"
										>
											{selectedCandidate.phone}
										</a>
									</div>
									<div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
										<RiMapPinLine className="text-gray-400 shrink-0" size={14} />
										<span className="font-medium text-gray-800">
											City / Location:{" "}
											<strong className="text-gray-900">
												{selectedCandidate.city || selectedCandidate.currentLocation || "Not specified"}
											</strong>
										</span>
									</div>
								</div>
							</div>

							{/* Employment Details */}
							<div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 pb-1 border-b border-gray-100">
									Experience & Compensation
								</h4>
								<div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs bg-[#F5F5F7] p-3.5 sm:p-4 rounded-2xl">
									<div>
										<span className="text-gray-400 block text-[10px] uppercase font-semibold">
											Experience
										</span>
										<strong className="text-sm font-bold text-gray-900">
											{selectedCandidate.experience || selectedCandidate.experienceYears || "Not specified"}
										</strong>
									</div>
									<div>
										<span className="text-gray-400 block text-[10px] uppercase font-semibold">
											Notice Period
										</span>
										<strong className="text-sm font-bold text-gray-900">
											{selectedCandidate.noticePeriod || "Not specified"}
										</strong>
									</div>
									<div>
										<span className="text-gray-400 block text-[10px] uppercase font-semibold">
											Current CTC
										</span>
										<strong className="text-sm font-bold text-gray-900">
											{selectedCandidate.currentCtc || "N/A"}
										</strong>
									</div>
									<div>
										<span className="text-gray-400 block text-[10px] uppercase font-semibold">
											Expected CTC
										</span>
										<strong className="text-sm font-bold text-gray-900">
											{selectedCandidate.expectedCtc || "N/A"}
										</strong>
									</div>
								</div>
							</div>

							{/* Resume & Portfolio */}
							<div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 pb-1 border-b border-gray-100">
									Resume & Links
								</h4>
								<div className="flex flex-wrap items-center gap-2">
									{selectedCandidate.resumeUrl ? (
										selectedCandidate.resumeUrl.startsWith("http://") ||
										selectedCandidate.resumeUrl.startsWith("https://") ? (
											<a
												href={selectedCandidate.resumeUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-black text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-xs"
											>
												<RiFileTextLine size={15} />
												<span>View Resume</span>
												<RiExternalLinkLine size={12} />
											</a>
										) : (
											<div className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#F5F5F7] border border-gray-200 text-gray-900 rounded-xl text-xs font-medium">
												<RiFileTextLine size={15} className="text-gray-500" />
												<span className="font-semibold">{selectedCandidate.resumeUrl}</span>
												<span className="text-[10px] text-gray-400">(Uploaded File)</span>
											</div>
										)
									) : (
										<span className="text-xs text-gray-400 italic">No resume attached</span>
									)}

									{selectedCandidate.linkedinUrl ? (
										<a
											href={
												selectedCandidate.linkedinUrl.startsWith("http")
													? selectedCandidate.linkedinUrl
													: `https://${selectedCandidate.linkedinUrl}`
											}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors"
										>
											<RiLinkedinBoxLine size={14} />
											<span>LinkedIn</span>
											<RiExternalLinkLine size={11} />
										</a>
									) : null}

									{selectedCandidate.portfolioUrl ? (
										<a
											href={
												selectedCandidate.portfolioUrl.startsWith("http")
													? selectedCandidate.portfolioUrl
													: `https://${selectedCandidate.portfolioUrl}`
											}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold transition-colors"
										>
											<RiGlobalLine size={14} />
											<span>Portfolio</span>
											<RiExternalLinkLine size={11} />
										</a>
									) : null}
								</div>
							</div>

							{/* Screening Questions Q&A */}
							<div>
								<div className="flex items-center justify-between mb-3 pb-1 border-b border-gray-100">
									<h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
										Screening Questions & Candidate Responses
									</h4>
									{selectedCandidate.screeningAnswers && (
										<span className="text-[11px] font-semibold text-gray-500">
											{Object.keys(selectedCandidate.screeningAnswers).length} Answered
										</span>
									)}
								</div>

								{selectedCandidate.screeningAnswers &&
								Object.keys(selectedCandidate.screeningAnswers).length > 0 ? (
									<div className="space-y-3">
										{Object.entries(
											selectedCandidate.screeningAnswers
										).map(([qKey, ans], idx) => {
											const qDetails = getQuestionDetails(qKey, idx);
											return (
												<div
													key={qKey}
													className="p-3.5 sm:p-4 rounded-2xl bg-[#F5F5F7] border border-gray-200/70 hover:border-gray-300 transition-colors"
												>
													<div className="flex items-start gap-2 mb-2">
														<span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
															{idx + 1}
														</span>
														<p className="text-xs font-semibold text-gray-900 leading-snug">
															{qDetails.title}
														</p>
													</div>

													<div className="sm:pl-7 mt-1.5">
														<div className="max-w-full break-words inline-block px-3 py-1.5 rounded-xl bg-white border border-gray-200/90 text-xs font-bold text-gray-900 shadow-2xs">
															{ans || "No response provided"}
														</div>
													</div>
												</div>
											);
										})}
									</div>
								) : (
									<div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-400 italic">
										No specific screening questions attached to this application.
									</div>
								)}
							</div>

							{/* Candidate Note if available */}
							{selectedCandidate.coverNote &&
								!selectedCandidate.coverNote.startsWith("Notice:") && (
									<div>
										<h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 pb-1 border-b border-gray-100">
											Candidate Note / Remarks
										</h4>
										<div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-gray-200/60 text-xs text-gray-800 leading-relaxed">
											{selectedCandidate.coverNote}
										</div>
									</div>
								)}

							{/* Internal HR Notes */}
							<div>
								<div className="flex items-center justify-between mb-2">
									<h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
										Internal HR Notes
									</h4>
									{notesSavedSuccess && (
										<span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
											<RiCheckLine size={14} /> Saved to database
										</span>
									)}
								</div>
								<textarea
									rows={3}
									value={notesInput}
									onChange={(e) => setNotesInput(e.target.value)}
									placeholder="Write notes about candidate interview, salary discussion, or feedback..."
									className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-black focus:outline-none bg-white"
								/>
								<div className="flex items-center justify-between mt-2">
									<button
										type="button"
										onClick={handleSaveNotes}
										disabled={isSavingNotes}
										className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black text-white hover:bg-gray-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
									>
										{isSavingNotes ? "Saving..." : "Save Note"}
									</button>
									<span className="text-[11px] text-gray-400">
										Visible only to hiring team
									</span>
								</div>
							</div>

							{/* Danger Zone: Delete Application */}
							<div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/40 p-3.5 rounded-2xl border border-red-100">
								<div>
									<h5 className="text-xs font-bold text-red-950">
										Delete Application
									</h5>
									<p className="text-[11px] text-red-600/80">
										Permanently remove this candidate and notes from AWS PostgreSQL.
									</p>
								</div>
								<button
									type="button"
									onClick={() =>
										handleDeleteApplication(
											selectedCandidate.id,
											selectedCandidate.fullName
										)
									}
									className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-600 hover:text-white text-red-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
								>
									<RiDeleteBinLine size={14} />
									<span>Delete Candidate</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</AuthGuard>
	);
}

export default function ApplicationsPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-[400px] flex items-center justify-center">
					<div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
				</div>
			}
		>
			<ApplicationsContent />
		</Suspense>
	);
}
