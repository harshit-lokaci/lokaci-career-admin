const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const jobsData = [
	{
		id: "field-sales-rep",
		title: "Field Sales Representative",
		department: "Sales & Operations",
		location: "Koramangala, Bengaluru, Karnataka",
		type: "Full-time",
		experience: "0–3 years",
		salary: "₹25,000 - ₹35,000 / month + Incentives",
		status: "active",
		overview:
			"The Field Sales Executive will be responsible for onboarding salons and the employees working in those salons (hairdressers, hairstylists, beauticians, barbers, etc.). The role involves extensive fieldwork across Bengaluru, daily salon visits, and achieving high-volume onboarding targets.",
		responsibilities: [
			"Visit salons across Bengaluru to onboard new salons onto the platform/company.",
			"Identify and onboard employees working within salons, including hairdressers, hairstylists, beauticians, and barbers.",
			"Achieve a daily onboarding target of 30–35 candidates from salons.",
			"Build strong relationships with salon owners, managers, and staff.",
			"Collect and verify required documents from salons and candidates.",
			"Submit daily field reports on targets achieved and market feedback.",
		],
		requirements: [
			"0–3 years of experience in field sales or field recruitment.",
			"Strong communication and convincing skills.",
			"Comfortable with daily fieldwork and target-driven role.",
			"Two-wheeler with valid driving license.",
		],
		benefits: [
			"Paid time off",
			"Cell phone reimbursement",
			"Commuter / Fuel assistance",
			"Performance-based incentives",
		],
		screeningQuestions: [
			{
				id: "two_wheeler",
				question:
					"Do you have a two-wheeler with a valid driving license for daily field visits?",
				type: "radio",
				options: ["Yes, I have both", "No"],
				required: true,
			},
			{
				id: "bengaluru_travel",
				question:
					"Are you comfortable with extensive daily salon visits across Bengaluru?",
				type: "radio",
				options: ["Yes, completely comfortable", "No"],
				required: true,
			},
			{
				id: "daily_onboarding_target",
				question:
					"How many salon visits or candidate onboardings have you handled previously?",
				type: "select",
				options: [
					"30+ per day (High volume experience)",
					"15–30 per day",
					"Less than 15 per day",
					"Fresher / No prior experience",
				],
				required: true,
			},
			{
				id: "languages_spoken",
				question:
					"Which languages can you comfortably speak with salon staff?",
				type: "text",
				placeholder: "e.g., Kannada, Hindi, English",
				required: true,
			},
		],
	},
	{
		id: "react-native-dev",
		title: "React Native Developer",
		department: "Engineering",
		location: "Noida (Sector 117)",
		type: "Full-time",
		experience: "2–5 years",
		salary: "₹6,00,000 - ₹10,00,000 / year",
		status: "active",
		overview:
			"Design, develop, test, and maintain high-quality mobile applications for Android and iOS platforms using React Native.",
		responsibilities: [
			"Design, develop, test, and maintain high-quality mobile applications for Android and iOS platforms using React Native.",
			"Collaborate with cross-functional teams to identify requirements and implement solutions that meet business needs.",
			"Ensure seamless integration of payment gateways into the application using relevant technologies.",
		],
		requirements: [
			"React Native CLI",
			"Android & iOS build processes",
			"Git (branching, merging, conflict resolution)",
			"REST API integration",
			"Debugging on real devices",
			"Mandatory Project Experience: Payment Gateway Integration",
		],
		benefits: [
			"Competitive salary",
			"Fast-track growth in core tech startup",
			"Annual performance bonus",
		],
		screeningQuestions: [
			{
				id: "payment_gateway",
				question:
					"Have you integrated Payment Gateways (e.g., Razorpay, Stripe, Cashfree) in production React Native apps?",
				type: "radio",
				options: [
					"Yes, in production live apps",
					"Yes, in personal/test projects",
					"No prior payment gateway experience",
				],
				required: true,
			},
			{
				id: "native_cli_exp",
				question:
					"How comfortable are you with React Native CLI, Gradle build errors, and iOS Xcode/CocoaPods?",
				type: "select",
				options: [
					"Very comfortable (regularly debug native Android/iOS code)",
					"Moderate (need occasional guidance/documentation)",
					"Only familiar with Expo workflow",
				],
				required: true,
			},
			{
				id: "rn_experience_years",
				question: "Total commercial experience with React Native:",
				type: "select",
				options: ["Under 1 year", "1–2 years", "2–4 years", "4+ years"],
				required: true,
			},
			{
				id: "live_apps",
				question:
					"Share links to live apps you've built (Play Store / App Store) or your GitHub profile:",
				type: "text",
				placeholder: "https://play.google.com/store/apps/... or https://github.com/...",
				required: true,
			},
		],
	},
	{
		id: "ui-ux-designer",
		title: "Ux And Ui Designer",
		department: "Product Design",
		location: "Noida (Sector 117)",
		type: "Full-time",
		experience: "1–2 years",
		salary: "₹4,00,000 - ₹6,50,000 / year",
		status: "active",
		overview:
			"Create wireframes & prototypes using Figma, Adobe XD, Sketching. Conduct user research & usability testing.",
		responsibilities: [
			"Create wireframes & prototypes using Figma, Adobe XD, Sketching.",
			"Conduct user research & usability testing.",
			"Collaborate with cross-functional teams on product development.",
		],
		requirements: [
			"Figma, Adobe XD, Sketching",
			"UI/UX Wireframing, Prototyping",
			"User Research & Design Systems",
		],
		benefits: [
			"Creative freedom to shape Lokaci's visual identity",
			"Mentorship & rapid ownership",
		],
		screeningQuestions: [
			{
				id: "portfolio_link",
				question:
					"Link to your portfolio / Figma showcase / Behance (Mandatory):",
				type: "text",
				placeholder: "https://figma.com/@... or https://behance.net/...",
				required: true,
			},
			{
				id: "design_system_exp",
				question:
					"How comfortable are you building & managing Design Systems with Figma Auto Layout & Tokens?",
				type: "select",
				options: [
					"Advanced (built and maintained full systems from scratch)",
					"Intermediate (comfortable with components & variants)",
					"Beginner / Basic knowledge",
				],
				required: true,
			},
			{
				id: "product_experience",
				question:
					"What types of digital products have you primarily designed?",
				type: "radio",
				options: [
					"Both B2B Web dashboards & Mobile apps",
					"Consumer Mobile Apps only",
					"B2B SaaS / Web Dashboards only",
					"Marketing Websites / Graphic Design",
				],
				required: true,
			},
		],
	},
	{
		id: "backend-nodejs-dev",
		title: "Backend Node.js Engineer",
		department: "Engineering",
		location: "Noida / Remote",
		type: "Full-time",
		experience: "2–4 years",
		salary: "₹7,00,000 - ₹11,00,000 / year",
		status: "inactive",
		overview:
			"Architect scalable REST APIs, microservices, and high-performance databases for Lokaci's salon ecosystem.",
		responsibilities: [
			"Build and maintain robust Node.js backend services.",
			"Optimize MongoDB and PostgreSQL queries.",
			"Integrate AWS services (S3, SQS, SES).",
		],
		requirements: [
			"Strong expertise in Node.js, Express, and async patterns.",
			"Solid database modeling experience.",
		],
		benefits: ["Flexible remote policy", "Health insurance"],
		screeningQuestions: [
			{
				id: "mongo_exp",
				question:
					"Have you built production microservices handling 10k+ requests/minute in Node.js?",
				type: "radio",
				options: ["Yes, extensive experience", "Moderate", "No"],
				required: true,
			},
		],
	},
];

const applicationsData = [
	{
		id: "app-101",
		jobId: "field-sales-rep",
		fullName: "Ramesh Gowda",
		email: "ramesh.gowda@gmail.com",
		phone: "+91 98450 12345",
		currentLocation: "Bengaluru (BTM Layout)",
		experienceYears: "2 years",
		resumeUrl:
			"https://lokaci-resumes.s3.ap-south-1.amazonaws.com/resumes/ramesh_gowda_cv.pdf",
		coverNote:
			"Strong Kannada & English communication. Handled 30+ daily shop visits at previous FMCG job.",
		status: "shortlisted",
		answers: {
			two_wheeler: "Yes, I have both",
			bengaluru_travel: "Yes, completely comfortable",
			daily_onboarding_target: "30+ per day (High volume experience)",
			languages_spoken: "Kannada, Telugu, Hindi, English",
		},
	},
	{
		id: "app-102",
		jobId: "react-native-dev",
		fullName: "Amit Verma",
		email: "amit.verma.code@gmail.com",
		phone: "+91 99100 45678",
		currentLocation: "Noida (Sector 62)",
		experienceYears: "3.5 years",
		resumeUrl:
			"https://lokaci-resumes.s3.ap-south-1.amazonaws.com/resumes/amit_verma_rn.pdf",
		coverNote:
			"Technical round 1 cleared on Oct 13. Excellent knowledge of native Android build tools & Razorpay custom SDK.",
		status: "reviewed",
		answers: {
			payment_gateway: "Yes, in production live apps",
			native_cli_exp:
				"Very comfortable (regularly debug native Android/iOS code)",
			rn_experience_years: "2–4 years",
			live_apps:
				"https://play.google.com/store/apps/details?id=com.quicksalon.app",
		},
	},
	{
		id: "app-103",
		jobId: "ui-ux-designer",
		fullName: "Pooja Malhotra",
		email: "pooja.designs@outlook.com",
		phone: "+91 98111 88990",
		currentLocation: "New Delhi",
		experienceYears: "1.5 years",
		resumeUrl:
			"https://lokaci-resumes.s3.ap-south-1.amazonaws.com/resumes/pooja_malhotra_ux.pdf",
		coverNote: "Portfolio: https://behance.net/poojamalhotra",
		status: "new",
		answers: {
			portfolio_link: "https://figma.com/@poojadesigns",
			design_system_exp: "Intermediate (comfortable with components & variants)",
			product_experience: "Both B2B Web dashboards & Mobile apps",
		},
	},
	{
		id: "app-104",
		jobId: "field-sales-rep",
		fullName: "Kiran Kumar",
		email: "kiran.k2024@gmail.com",
		phone: "+91 80955 77123",
		currentLocation: "Bengaluru (Koramangala)",
		experienceYears: "Fresher",
		resumeUrl:
			"https://lokaci-resumes.s3.ap-south-1.amazonaws.com/resumes/kiran_kumar.pdf",
		coverNote: "Does not possess a two-wheeler for field travel.",
		status: "rejected",
		answers: {
			two_wheeler: "No",
			bengaluru_travel: "Yes, completely comfortable",
			daily_onboarding_target: "Fresher / No prior experience",
			languages_spoken: "Hindi, English",
		},
	},
];

async function seed() {
	console.log("Seeding initial data into lokaci_careers database...");

	for (const job of jobsData) {
		await prisma.job.upsert({
			where: { id: job.id },
			update: job,
			create: job,
		});
		console.log(`✓ Job seeded: ${job.title}`);
	}

	for (const app of applicationsData) {
		await prisma.application.upsert({
			where: { id: app.id },
			update: app,
			create: app,
		});
		console.log(`✓ Application seeded: ${app.fullName}`);
	}

	console.log("\nDatabase seeding completed successfully!");
}

seed()
	.catch((e) => {
		console.error("Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
