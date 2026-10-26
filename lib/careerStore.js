"use client";

import { initialJobs, initialApplications } from "./initialData";

const JOBS_STORAGE_KEY = "lokaci_admin_jobs_v1";
const APPS_STORAGE_KEY = "lokaci_admin_applications_v1";
const AUTH_STORAGE_KEY = "lokaci_admin_session_v1";

export const careerStore = {
	// --- JOBS ---
	getJobs: () => {
		if (typeof window === "undefined") return initialJobs;
		try {
			const saved = localStorage.getItem(JOBS_STORAGE_KEY);
			if (saved) return JSON.parse(saved);
			localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(initialJobs));
			return initialJobs;
		} catch {
			return initialJobs;
		}
	},

	saveJobs: (jobs) => {
		if (typeof window === "undefined") return;
		try {
			localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
		} catch (err) {
			console.error("Failed to save jobs to localStorage:", err);
		}
	},

	addJob: (jobData) => {
		const currentJobs = careerStore.getJobs();
		const newId =
			jobData.title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/(^-|-$)/g, "") + `-${Date.now().toString(36)}`;

		const newJob = {
			...jobData,
			id: newId,
			company: jobData.company || "Lokaci Innovations Technologies",
			status: jobData.status || "active",
			postedDate: new Date().toISOString().split("T")[0],
			tags: jobData.tags?.length ? jobData.tags : ["Full-time", jobData.department || "General"],
		};

		const updated = [newJob, ...currentJobs];
		careerStore.saveJobs(updated);
		return newJob;
	},

	updateJob: (id, updatedFields) => {
		const currentJobs = careerStore.getJobs();
		const updated = currentJobs.map((job) =>
			job.id === id ? { ...job, ...updatedFields } : job
		);
		careerStore.saveJobs(updated);
		return updated.find((j) => j.id === id);
	},

	toggleJobStatus: (id) => {
		const currentJobs = careerStore.getJobs();
		const updated = currentJobs.map((job) => {
			if (job.id === id) {
				return {
					...job,
					status: job.status === "active" ? "inactive" : "active",
				};
			}
			return job;
		});
		careerStore.saveJobs(updated);
		return updated;
	},

	deleteJob: (id) => {
		const currentJobs = careerStore.getJobs();
		const updated = currentJobs.filter((job) => job.id !== id);
		careerStore.saveJobs(updated);
		return updated;
	},

	// --- APPLICATIONS ---
	getApplications: () => {
		if (typeof window === "undefined") return initialApplications;
		try {
			const saved = localStorage.getItem(APPS_STORAGE_KEY);
			if (saved) return JSON.parse(saved);
			localStorage.setItem(
				APPS_STORAGE_KEY,
				JSON.stringify(initialApplications)
			);
			return initialApplications;
		} catch {
			return initialApplications;
		}
	},

	saveApplications: (apps) => {
		if (typeof window === "undefined") return;
		try {
			localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
		} catch (err) {
			console.error("Failed to save applications to localStorage:", err);
		}
	},

	updateApplicationStatus: (id, newStatus) => {
		const currentApps = careerStore.getApplications();
		const updated = currentApps.map((app) =>
			app.id === id ? { ...app, status: newStatus } : app
		);
		careerStore.saveApplications(updated);
		return updated;
	},

	updateApplicationNotes: (id, notes) => {
		const currentApps = careerStore.getApplications();
		const updated = currentApps.map((app) =>
			app.id === id ? { ...app, notes } : app
		);
		careerStore.saveApplications(updated);
		return updated;
	},

	deleteApplication: (id) => {
		const currentApps = careerStore.getApplications();
		const updated = currentApps.filter((app) => app.id !== id);
		careerStore.saveApplications(updated);
		return updated;
	},

	// --- ANALYTICS ---
	getAnalytics: () => {
		const jobs = careerStore.getJobs();
		const apps = careerStore.getApplications();

		const activeJobs = jobs.filter((j) => j.status === "active").length;
		const inactiveJobs = jobs.filter((j) => j.status === "inactive").length;
		const totalApplications = apps.length;

		const shortlisted = apps.filter((a) => a.status === "shortlisted").length;
		const inInterview = apps.filter((a) => a.status === "interview").length;
		const rejected = apps.filter((a) => a.status === "rejected").length;
		const newApplied = apps.filter((a) => a.status === "applied").length;

		// Today applications (in local time)
		const todayStr = new Date().toISOString().split("T")[0];
		const todayCount = apps.filter((a) =>
			(a.appliedAt || "").startsWith(todayStr)
		).length;

		return {
			totalJobs: jobs.length,
			activeJobs,
			inactiveJobs,
			totalApplications,
			todayCount,
			shortlisted,
			inInterview,
			rejected,
			newApplied,
		};
	},

	// --- AUTHENTICATION ---
	login: async (email, password) => {
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			const data = await res.json();
			if (data.success && data.token) {
				const session = {
					user: data.user,
					token: data.token,
					expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
				};
				if (typeof window !== "undefined") {
					localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
				}
				return { success: true, session };
			}
			return { success: false, error: data.error || "Invalid email or password." };
		} catch (err) {
			console.error("Login API error:", err);
			return { success: false, error: "Network error connecting to auth server." };
		}
	},

	logout: () => {
		if (typeof window !== "undefined") {
			localStorage.removeItem(AUTH_STORAGE_KEY);
		}
	},

	getToken: () => {
		if (typeof window === "undefined") return null;
		const session = careerStore.getCurrentSession();
		return session?.token || null;
	},

	getAuthHeaders: (customHeaders = {}) => {
		const token = careerStore.getToken();
		return {
			...customHeaders,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		};
	},

	getCurrentSession: () => {
		if (typeof window === "undefined") return null;
		try {
			const raw = localStorage.getItem(AUTH_STORAGE_KEY);
			if (!raw) return null;
			const session = JSON.parse(raw);
			if (session.expiresAt && Date.now() > session.expiresAt) {
				localStorage.removeItem(AUTH_STORAGE_KEY);
				return null;
			}
			return session;
		} catch {
			return null;
		}
	},
};
