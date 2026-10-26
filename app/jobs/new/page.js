"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
	RiAddLine,
	RiArrowLeftLine,
	RiBriefcaseLine,
	RiCheckLine,
	RiDeleteBinLine,
	RiExternalLinkLine,
	RiFileCopyLine,
	RiQuestionLine,
	RiSaveLine,
} from "react-icons/ri";
import AuthGuard from "@/components/AuthGuard";
import { careerStore } from "@/lib/careerStore";

function JobFormContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const editId = searchParams.get("id");

	const [isEditMode, setIsEditMode] = useState(false);
	const [formData, setFormData] = useState({
		title: "",
		department: "",
		location: "",
		type: "Full-time",
		experience: "",
		salary: "",
		status: "active",
		overview: "",
		responsibilitiesText: "",
		requirementsText: "",
		benefitsText: "",
		screeningQuestions: [],
	});

	const [errors, setErrors] = useState({});
	const [isSaving, setIsSaving] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);

	const handleCopyPublicLink = async () => {
		if (!editId) return;
		const baseUrl =
			process.env.NEXT_PUBLIC_CAREER_SITE_URL ||
			"https://lokaci.com";
		const fullUrl = `${baseUrl.replace(/\/$/, "")}/career/openings/${editId}`;
		try {
			await navigator.clipboard.writeText(fullUrl);
			setCopiedLink(true);
			setTimeout(() => setCopiedLink(false), 2000);
		} catch (err) {
			console.error("Failed to copy public link:", err);
		}
	};

	useEffect(() => {
		if (editId) {
			fetch(`/api/jobs/${editId}`)
				.then((r) => r.json())
				.then((json) => {
					if (json.success && json.data) {
						const existing = json.data;
						setIsEditMode(true);
						setFormData({
							title: existing.title || "",
							department: existing.department || "General",
							location: existing.location || "",
							type: existing.type || "Full-time",
							experience: existing.experience || "",
							salary: existing.salary || "",
							status: existing.status || "active",
							overview:
								existing.overview ||
								existing.description?.overview ||
								"",
							responsibilitiesText: (
								existing.responsibilities ||
								existing.description?.responsibilities ||
								[]
							).join("\n"),
							requirementsText: (
								existing.requirements ||
								existing.description?.requirements ||
								[]
							).join("\n"),
							benefitsText: (
								existing.benefits ||
								existing.description?.benefits ||
								[]
							).join("\n"),
							screeningQuestions:
								existing.screeningQuestions || [],
						});
					} else {
						// Fallback to local store if API fails
						const allJobs = careerStore.getJobs();
						const existing = allJobs.find((j) => j.id === editId);
						if (existing) {
							setIsEditMode(true);
							setFormData({
								title: existing.title || "",
								department: existing.department || "General",
								location: existing.location || "",
								type: existing.type || "Full-time",
								experience: existing.experience || "",
								salary: existing.salary || "",
								status: existing.status || "active",
								overview: existing.description?.overview || "",
								responsibilitiesText: (
									existing.description?.responsibilities || []
								).join("\n"),
								requirementsText: (
									existing.description?.requirements || []
								).join("\n"),
								benefitsText: (
									existing.description?.benefits || []
								).join("\n"),
								screeningQuestions:
									existing.screeningQuestions || [],
							});
						}
					}
				})
				.catch(() => {
					const allJobs = careerStore.getJobs();
					const existing = allJobs.find((j) => j.id === editId);
					if (existing) {
						setIsEditMode(true);
						setFormData({
							title: existing.title || "",
							department: existing.department || "General",
							location: existing.location || "",
							type: existing.type || "Full-time",
							experience: existing.experience || "",
							salary: existing.salary || "",
							status: existing.status || "active",
							overview: existing.description?.overview || "",
							responsibilitiesText: (
								existing.description?.responsibilities || []
							).join("\n"),
							requirementsText: (
								existing.description?.requirements || []
							).join("\n"),
							benefitsText: (
								existing.description?.benefits || []
							).join("\n"),
							screeningQuestions:
								existing.screeningQuestions || [],
						});
					}
				});
		}
	}, [editId]);

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => {
				const next = { ...prev };
				delete next[field];
				return next;
			});
		}
	};

	const handleAddQuestion = () => {
		const newQ = {
			id: `q_${Date.now().toString(36)}`,
			question: "",
			type: "radio",
			options: ["Yes", "No"],
			optionsString: "Yes, No",
			required: true,
		};
		setFormData((prev) => ({
			...prev,
			screeningQuestions: [...prev.screeningQuestions, newQ],
		}));
	};

	const handleUpdateQuestion = (index, field, value) => {
		setFormData((prev) => {
			const updated = [...prev.screeningQuestions];
			if (field === "optionsString") {
				updated[index].optionsString = value;
				updated[index].options = value
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean);
			} else {
				updated[index][field] = value;
			}
			return { ...prev, screeningQuestions: updated };
		});
	};

	const handleRemoveQuestion = (index) => {
		setFormData((prev) => ({
			...prev,
			screeningQuestions: prev.screeningQuestions.filter(
				(_, i) => i !== index
			),
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const newErrors = {};

		if (!formData.title.trim()) {
			newErrors.title = "Job title is required.";
		}
		if (!formData.location.trim()) {
			newErrors.location = "Job location is required.";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			window.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}

		setIsSaving(true);

		const responsibilities = formData.responsibilitiesText
			.split("\n")
			.map((s) => s.trim())
			.filter(Boolean);
		const requirements = formData.requirementsText
			.split("\n")
			.map((s) => s.trim())
			.filter(Boolean);
		const benefits = formData.benefitsText
			.split("\n")
			.map((s) => s.trim())
			.filter(Boolean);

		const cleanScreeningQuestions = formData.screeningQuestions.map(
			({ optionsString, ...q }) => ({
				...q,
				options: Array.isArray(q.options)
					? q.options
					: typeof optionsString === "string"
					? optionsString
							.split(",")
							.map((s) => s.trim())
							.filter(Boolean)
					: [],
			})
		);

		const payload = {
			title: formData.title.trim(),
			department: formData.department.trim(),
			location: formData.location.trim(),
			type: formData.type,
			experience: formData.experience.trim(),
			salary: formData.salary.trim(),
			status: formData.status,
			overview: formData.overview.trim(),
			responsibilities,
			requirements,
			benefits,
			screeningQuestions: cleanScreeningQuestions,
		};

		try {
			if (isEditMode && editId) {
				await fetch(`/api/jobs/${editId}`, {
					method: "PUT",
					headers: careerStore.getAuthHeaders({ "Content-Type": "application/json" }),
					body: JSON.stringify(payload),
				});
			} else {
				await fetch("/api/jobs", {
					method: "POST",
					headers: careerStore.getAuthHeaders({ "Content-Type": "application/json" }),
					body: JSON.stringify(payload),
				});
			}
			// Update local cache as well
			careerStore.addJob(payload);
			router.push("/jobs");
		} catch (err) {
			console.error("Failed to save job to PostgreSQL:", err);
			careerStore.addJob(payload);
			router.push("/jobs");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
			{/* Breadcrumb & Navigation */}
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Link
					href="/jobs"
					className="inline-flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
				>
					<RiArrowLeftLine size={16} />
					<span>Back to Jobs</span>
				</Link>

				<div className="flex items-center gap-2">
					{isEditMode && editId && (
						<>
							<button
								type="button"
								onClick={handleCopyPublicLink}
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
									copiedLink
										? "bg-emerald-50 text-emerald-700 border border-emerald-200"
										: "bg-white border border-gray-200 hover:border-black text-gray-700"
								}`}
								title="Copy public URL to share"
							>
								{copiedLink ? (
									<RiCheckLine size={13} className="text-emerald-600" />
								) : (
									<RiFileCopyLine size={13} />
								)}
								<span>{copiedLink ? "Link Copied!" : "Copy Public Link"}</span>
							</button>

							<a
								href={`${(process.env.NEXT_PUBLIC_CAREER_SITE_URL || "https://lokaci.com").replace(/\/$/, "")}/career/openings/${editId}`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-[#F5F5F7] hover:bg-gray-200 text-gray-700 transition-colors"
								title="Open public job page in new tab"
							>
								<span>View Live</span>
								<RiExternalLinkLine size={12} />
							</a>
						</>
					)}

					<span className="text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full bg-gray-100 text-gray-700">
						{isEditMode ? "Editing Role" : "New Opening"}
					</span>
				</div>
			</div>

			{/* Page Header */}
			<div>
				<h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 break-words">
					{isEditMode ? `Edit Role: ${formData.title}` : "Post a New Opening"}
				</h1>
				<p className="text-xs md:text-sm text-gray-500 mt-1">
					Fill out the details below to publish this role on the Lokaci Career portal.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
				{/* ================= CARD 1: ROLE OVERVIEW ================= */}
				<div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs space-y-5 sm:space-y-6">
					<div className="flex items-center gap-2.5 pb-3 sm:pb-4 border-b border-gray-100">
						<div className="p-2 bg-[#F5F5F7] rounded-xl text-black shrink-0">
							<RiBriefcaseLine size={18} />
						</div>
						<div>
							<h3 className="text-sm font-bold text-gray-900">
								1. Basic Information
							</h3>
							<p className="text-[11px] text-gray-400">
								Title, location, department, and employment details
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
								Job Title *
							</label>
							<input
								type="text"
								value={formData.title}
								onChange={(e) =>
									handleInputChange("title", e.target.value)
								}
								placeholder="e.g. React Native Developer"
								className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F5F7] rounded-xl text-base font-normal text-gray-900 focus:outline-none border ${
									errors.title
										? "border-red-400"
										: "border-transparent focus:border-black"
								} transition-colors`}
							/>
							{errors.title && (
								<p className="text-xs text-red-500 mt-1">
									{errors.title}
								</p>
							)}
						</div>

						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
								Department / Category
							</label>
							<input
								type="text"
								value={formData.department}
								onChange={(e) =>
									handleInputChange("department", e.target.value)
								}
								placeholder="e.g. Engineering, Sales, Product"
								className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-base font-normal text-gray-900 focus:outline-none transition-colors"
							/>
						</div>

						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
								Job Location *
							</label>
							<input
								type="text"
								value={formData.location}
								onChange={(e) =>
									handleInputChange("location", e.target.value)
								}
								placeholder="e.g. Koramangala, Bengaluru or Noida"
								className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F5F7] rounded-xl text-base font-normal text-gray-900 focus:outline-none border ${
									errors.location
										? "border-red-400"
										: "border-transparent focus:border-black"
								} transition-colors`}
							/>
							{errors.location && (
								<p className="text-xs text-red-500 mt-1">
									{errors.location}
								</p>
							)}
						</div>

						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
								Job Type
							</label>
							<select
								value={formData.type}
								onChange={(e) =>
									handleInputChange("type", e.target.value)
								}
								className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-base font-normal text-gray-900 focus:outline-none transition-colors cursor-pointer"
							>
								<option value="Full-time">Full-time</option>
								<option value="Part-time">Part-time</option>
								<option value="Contract">Contract</option>
								<option value="Internship">Internship</option>
							</select>
						</div>

						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
								Experience Required
							</label>
							<input
								type="text"
								value={formData.experience}
								onChange={(e) =>
									handleInputChange("experience", e.target.value)
								}
								placeholder="e.g. 2–5 years or Fresher"
								className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-base font-normal text-gray-900 focus:outline-none transition-colors"
							/>
						</div>

						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
								Salary / Compensation
							</label>
							<input
								type="text"
								value={formData.salary}
								onChange={(e) =>
									handleInputChange("salary", e.target.value)
								}
								placeholder="e.g. ₹6 LPA - ₹10 LPA or Competitive"
								className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-base font-normal text-gray-900 focus:outline-none transition-colors"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
							Role Overview Summary
						</label>
						<textarea
							rows={3}
							value={formData.overview}
							onChange={(e) =>
								handleInputChange("overview", e.target.value)
							}
							placeholder="Write a concise overview explaining the mission of this role..."
							className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-base font-normal text-gray-900 focus:outline-none transition-colors"
						/>
					</div>
				</div>

				{/* ================= CARD 2: RESPONSIBILITIES & REQUIREMENTS ================= */}
				<div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs space-y-5 sm:space-y-6">
					<div className="pb-3 sm:pb-4 border-b border-gray-100">
						<h3 className="text-sm font-bold text-gray-900">
							2. Key Responsibilities & Requirements
						</h3>
						<p className="text-[11px] text-gray-400">
							Write each point on a new line (press Enter after each bullet point)
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
								Responsibilities (1 per line)
							</label>
							<textarea
								rows={6}
								value={formData.responsibilitiesText}
								onChange={(e) =>
									handleInputChange(
										"responsibilitiesText",
										e.target.value
									)
								}
								placeholder="Design and develop scalable mobile apps&#10;Collaborate with product and design&#10;Maintain code quality and testing"
								className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-base font-normal text-gray-900 focus:outline-none transition-colors leading-relaxed"
							/>
						</div>

						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
								Skills & Requirements (1 per line)
							</label>
							<textarea
								rows={6}
								value={formData.requirementsText}
								onChange={(e) =>
									handleInputChange(
										"requirementsText",
										e.target.value
									)
								}
								placeholder="React Native CLI and native build pipelines&#10;REST APIs and Git version control&#10;Strong problem-solving attitude"
								className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-base font-normal text-gray-900 focus:outline-none transition-colors leading-relaxed"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
							Benefits & Perks (1 per line)
						</label>
						<textarea
							rows={3}
							value={formData.benefitsText}
							onChange={(e) =>
								handleInputChange("benefitsText", e.target.value)
							}
							placeholder="Paid time off&#10;Commuter assistance&#10;Performance bonus"
							className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-base font-normal text-gray-900 focus:outline-none transition-colors leading-relaxed"
						/>
					</div>
				</div>

				{/* ================= CARD 3: SCREENING QUESTIONS ================= */}
				<div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs space-y-5 sm:space-y-6">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-gray-100 gap-3">
						<div>
							<h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
								<span>3. Role Screening Questions</span>
								<span className="px-2 py-0.5 rounded-full text-xs bg-black text-white font-semibold">
									{formData.screeningQuestions.length}
								</span>
							</h3>
							<p className="text-[11px] text-gray-400">
								Candidates will be required to answer these questions when applying
							</p>
						</div>

						<button
							type="button"
							onClick={handleAddQuestion}
							className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white hover:bg-gray-800 text-xs font-semibold transition-colors cursor-pointer w-full sm:w-auto"
						>
							<RiAddLine size={14} />
							<span>Add Screening Question</span>
						</button>
					</div>

					{formData.screeningQuestions.length === 0 ? (
						<div className="p-6 sm:p-8 text-center bg-[#F5F5F7] rounded-2xl text-gray-400">
							<RiQuestionLine size={28} className="mx-auto mb-1.5 opacity-40" />
							<p className="text-xs font-medium">No screening questions added yet.</p>
							<p className="text-[11px] text-gray-400 mt-0.5">Click &ldquo;Add Screening Question&rdquo; to add one.</p>
						</div>
					) : (
						<div className="space-y-3.5 sm:space-y-4">
							{formData.screeningQuestions.map((q, idx) => (
								<div
									key={q.id || idx}
									className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[#F5F5F7] border border-gray-200/60 space-y-3 sm:space-y-4"
								>
									<div className="flex items-start justify-between gap-2 sm:gap-3">
										<span className="text-xs font-bold text-gray-400 mt-2.5 shrink-0">
											Q{idx + 1}.
										</span>
										<input
											type="text"
											value={q.question}
											onChange={(e) =>
												handleUpdateQuestion(
													idx,
													"question",
													e.target.value
												)
											}
											placeholder="Write screening question text..."
											className="flex-1 min-w-0 bg-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-black"
										/>
										<button
											type="button"
											onClick={() => handleRemoveQuestion(idx)}
											className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
											title="Delete Question"
										>
											<RiDeleteBinLine size={17} />
										</button>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
										<div>
											<label className="block text-[11px] font-semibold text-gray-500 mb-1">
												Question Input Type
											</label>
											<select
												value={q.type}
												onChange={(e) =>
													handleUpdateQuestion(
														idx,
														"type",
														e.target.value
													)
												}
												className="w-full bg-white px-3 sm:px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none cursor-pointer"
											>
												<option value="radio">
													Radio Buttons (Single Selection)
												</option>
												<option value="select">
													Dropdown Menu
												</option>
												<option value="text">
													Short Text Response
												</option>
												<option value="textarea">
													Long Text Response (Paragraph)
												</option>
											</select>
										</div>

										{q.type !== "text" && q.type !== "textarea" && (
											<div>
												<label className="block text-[11px] font-semibold text-gray-500 mb-1">
													Options (separated by comma)
												</label>
												<input
													type="text"
													value={
														q.optionsString !== undefined
															? q.optionsString
															: (q.options || []).join(", ")
													}
													onChange={(e) =>
														handleUpdateQuestion(
															idx,
															"optionsString",
															e.target.value
														)
													}
													placeholder="e.g. Yes, No or 1-2 years, 3+ years"
													className="w-full bg-white px-3 sm:px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none"
												/>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* ================= STICKY BOTTOM ACTION BAR ================= */}
				<div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 sticky bottom-3 sm:bottom-6 z-20">
					<div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 sm:gap-3">
						<span className="text-xs font-semibold text-gray-600 shrink-0">
							Initial Status:
						</span>
						<div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl border border-gray-200 text-xs">
							<button
								type="button"
								onClick={() => handleInputChange("status", "active")}
								className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
									formData.status === "active"
										? "bg-emerald-600 text-white shadow-xs"
										: "text-gray-600 hover:text-black"
								}`}
							>
								Active (Live)
							</button>
							<button
								type="button"
								onClick={() => handleInputChange("status", "inactive")}
								className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
									formData.status === "inactive"
										? "bg-gray-800 text-white shadow-xs"
										: "text-gray-600 hover:text-black"
								}`}
							>
								Inactive (Draft)
							</button>
						</div>
					</div>

					<div className="flex items-center gap-2.5 w-full sm:w-auto">
						<Link
							href="/jobs"
							className="w-1/3 sm:w-auto px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-black transition-colors text-center cursor-pointer rounded-xl hover:bg-gray-100"
						>
							Cancel
						</Link>

						<button
							type="submit"
							disabled={isSaving}
							className="w-2/3 sm:w-auto inline-flex items-center justify-center gap-2 bg-black text-white px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-all shadow-md hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
						>
							<RiSaveLine size={16} />
							<span>
								{isSaving
									? "Saving..."
									: isEditMode
									? "Save Changes"
									: "Publish Job Opening"}
							</span>
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}

export default function PostJobPage() {
	return (
		<AuthGuard>
			<Suspense
				fallback={
					<div className="min-h-[400px] flex items-center justify-center">
						<div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
					</div>
				}
			>
				<JobFormContent />
			</Suspense>
		</AuthGuard>
	);
}
