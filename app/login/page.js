"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiEyeLine, RiEyeOffLine, RiLockPasswordLine, RiMailLine } from "react-icons/ri";
import { careerStore } from "@/lib/careerStore";

export default function LoginPage() {
	
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e) => {
		e.preventDefault();
		setError("");

		if (!email.trim() || !password.trim()) {
			setError("Please enter your admin email and password.");
			return;
		}

		setLoading(true);

		try {
			const res = await careerStore.login(email, password);
			if (res.success) {
				router.replace("/");
			} else {
				setError(res.error || "Invalid email or password.");
				setLoading(false);
			}
		} catch (err) {
			setError("An error occurred during sign in. Please try again.");
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
			{/* Subtle Background Glows */}
			<div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-gray-100/70 blur-[120px] pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-gray-100/70 blur-[120px] pointer-events-none" />

			<div className="w-full max-w-md relative z-10">
				{/* Brand Top Header */}
				<div className="text-center mb-8">
					<img
						src="/logo.png"
						alt="Lokaci"
						className="h-8 w-auto mx-auto mb-4"
					/>
					<p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">
						Career Admin Portal
					</p>
				</div>

				{/* Card Container */}
				<div className="bg-white p-5 sm:p-9 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
					{error && (
						<div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-medium flex items-center gap-2">
							<span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
						{/* Email */}
						<div>
							<label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
								Admin Email
							</label>
							<div className="relative">
								<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
									<RiMailLine size={17} />
								</span>
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="admin@lokaci.com"
									className="w-full pl-10 pr-4 py-3 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-base sm:text-sm text-gray-900 focus:outline-none transition-colors placeholder:text-gray-400"
								/>
							</div>
						</div>

						{/* Password */}
						<div>
							<label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
								Password
							</label>
							<div className="relative">
								<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
									<RiLockPasswordLine size={17} />
								</span>
								<input
									type={showPassword ? "text" : "password"}
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full pl-10 pr-10 py-3 bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl text-base sm:text-sm text-gray-900 focus:outline-none transition-colors placeholder:text-gray-400"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors cursor-pointer"
								>
									{showPassword ? (
										<RiEyeOffLine size={17} />
									) : (
										<RiEyeLine size={17} />
									)}
								</button>
							</div>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={loading}
							className="w-full bg-black text-white py-3.5 rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
						>
							{loading ? "Signing in..." : "Sign In"}
						</button>
					</form>
				</div>

				<p className="text-center text-[11px] text-gray-400 mt-6">
					© 2026 Lokaci Innovations & Technologies Pvt. Ltd.
				</p>
			</div>
		</div>
	);
}
