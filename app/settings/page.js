"use client";

import { useState } from "react";
import {
	RiCheckLine,
	RiDatabase2Line,
	RiHardDrive2Line,
	RiInformationLine,
	RiKeyLine,
	RiSaveLine,
	RiShieldCheckLine,
} from "react-icons/ri";
import AuthGuard from "@/components/AuthGuard";

export default function SettingsPage() {
	const [dbConfig, setDbConfig] = useState({
		dbType: "postgresql",
		connectionUri: "postgresql://propking_db:********@propking-db.cbyqgiqk6tr2.ap-southeast-1.rds.amazonaws.com:5432/lokaci_careers",
		s3Bucket: "lokaci-resumes-prod",
		s3Region: "ap-southeast-1",
		awsAccessKey: "AKIA****************",
	});

	const [isSaved, setIsSaved] = useState(false);

	const handleSave = (e) => {
		e.preventDefault();
		setIsSaved(true);
		setTimeout(() => setIsSaved(false), 3000);
	};

	return (
		<AuthGuard>
			<div className="max-w-4xl space-y-6">
				<div>
					<h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
						Settings & Infrastructure
					</h2>
					<p className="text-xs text-gray-500 mt-0.5">
						Configure your AWS Database connection and AWS S3 Resume bucket parameters
					</p>
				</div>

				{/* Info Notice Card */}
				<div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-3">
					<RiInformationLine size={18} className="shrink-0 text-blue-600 mt-0.5" />
					<div className="leading-relaxed">
						<strong className="font-semibold">Shared AWS Architecture:</strong>{" "}
						Both <code className="bg-white/80 px-1.5 py-0.5 rounded">lokaci.com-frontend</code> and <code className="bg-white/80 px-1.5 py-0.5 rounded">lokaci-admin</code> connect to the same AWS Database. When HR publishes an opening here, it reflects instantly on the live website.
					</div>
				</div>

				<form onSubmit={handleSave} className="space-y-6">
					{/* AWS Database Card */}
					<div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
						<div className="flex items-center gap-3 pb-3 border-b border-gray-100">
							<div className="p-2.5 bg-[#F5F5F7] rounded-xl text-black">
								<RiDatabase2Line size={20} />
							</div>
							<div>
								<h3 className="text-sm sm:text-base font-bold text-gray-900">
									AWS Database Connection
								</h3>
								<p className="text-xs text-gray-400">
									Existing database cluster reused for Career & Applications data
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-xs font-semibold text-gray-700 mb-1.5">
									Database Engine
								</label>
								<select
									value={dbConfig.dbType}
									onChange={(e) =>
										setDbConfig({ ...dbConfig, dbType: e.target.value })
									}
									className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm sm:text-xs text-gray-900 bg-white focus:outline-none focus:border-black cursor-pointer"
								>
									<option value="mongodb">MongoDB / AWS DocumentDB</option>
									<option value="postgresql">PostgreSQL (AWS RDS)</option>
									<option value="mysql">MySQL (AWS RDS)</option>
								</select>
							</div>

							<div>
								<label className="block text-xs font-semibold text-gray-700 mb-1.5">
									Target Collection / Table Prefix
								</label>
								<input
									type="text"
									defaultValue="career_jobs, career_applications"
									disabled
									className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm sm:text-xs text-gray-500 bg-[#F5F5F7]"
								/>
							</div>
						</div>

						<div>
							<label className="block text-xs font-semibold text-gray-700 mb-1.5">
								Connection URI (DATABASE_URL / AWS_MONGODB_URI)
							</label>
							<input
								type="text"
								value={dbConfig.connectionUri}
								onChange={(e) =>
									setDbConfig({
										...dbConfig,
										connectionUri: e.target.value,
									})
								}
								placeholder="mongodb+srv://user:password@cluster.mongodb.net/lokaci_career"
								className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm sm:text-xs font-mono text-gray-800 focus:outline-none focus:border-black"
							/>
							<p className="text-[11px] text-gray-400 mt-1">
								Kept secure inside <code className="bg-gray-100 px-1 rounded">.env.local</code> on deployment.
							</p>
						</div>
					</div>

					{/* AWS S3 Storage Card */}
					<div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
						<div className="flex items-center gap-3 pb-3 border-b border-gray-100">
							<div className="p-2.5 bg-[#F5F5F7] rounded-xl text-black">
								<RiHardDrive2Line size={20} />
							</div>
							<div>
								<h3 className="text-sm sm:text-base font-bold text-gray-900">
									AWS S3 Resume Storage
								</h3>
								<p className="text-xs text-gray-400">
									Where applicant CVs (PDF/DOCX) are securely stored
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-xs font-semibold text-gray-700 mb-1.5">
									S3 Bucket Name
								</label>
								<input
									type="text"
									value={dbConfig.s3Bucket}
									onChange={(e) =>
										setDbConfig({
											...dbConfig,
											s3Bucket: e.target.value,
										})
									}
									placeholder="e.g. lokaci-resumes-prod"
									className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm sm:text-xs text-gray-900 focus:outline-none focus:border-black"
								/>
							</div>

							<div>
								<label className="block text-xs font-semibold text-gray-700 mb-1.5">
									AWS Region
								</label>
								<input
									type="text"
									value={dbConfig.s3Region}
									onChange={(e) =>
										setDbConfig({
											...dbConfig,
											s3Region: e.target.value,
										})
									}
									placeholder="e.g. ap-south-1 (Mumbai)"
									className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm sm:text-xs text-gray-900 focus:outline-none focus:border-black"
								/>
							</div>
						</div>

						<div>
							<label className="block text-xs font-semibold text-gray-700 mb-1.5">
								AWS Access Key ID
							</label>
							<input
								type="text"
								value={dbConfig.awsAccessKey}
								onChange={(e) =>
									setDbConfig({
										...dbConfig,
										awsAccessKey: e.target.value,
									})
								}
								placeholder="AKIA..."
								className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm sm:text-xs font-mono text-gray-900 focus:outline-none focus:border-black"
							/>
						</div>
					</div>

					{/* Save Button */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
						{isSaved && (
							<span className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600">
								<RiCheckLine size={16} />
								<span>Configuration saved!</span>
							</span>
						)}

						<button
							type="submit"
							className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-all shadow-xs cursor-pointer"
						>
							<RiSaveLine size={15} />
							<span>Save Settings</span>
						</button>
					</div>
				</form>
			</div>
		</AuthGuard>
	);
}
