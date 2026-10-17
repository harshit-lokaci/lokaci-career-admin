const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Load DATABASE_URL from .env if not in environment
if (!process.env.DATABASE_URL) {
	try {
		const envPath = path.resolve(__dirname, "../.env");
		if (fs.existsSync(envPath)) {
			const envContent = fs.readFileSync(envPath, "utf8");
			const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
			if (match) {
				process.env.DATABASE_URL = match[1];
			}
		}
	} catch (e) {
		// Ignore
	}
}

async function main() {
	const email = "admin@lokaci.com";
	const plainPassword = "lokaci-admin";
	const name = "Lokaci HR Admin";
	const role = "HR SuperAdmin";

	console.log(`Generating secure bcrypt hash for ${email}...`);
	const passwordHash = await bcrypt.hash(plainPassword, 10);

	// Try Prisma Client first
	try {
		const { PrismaClient } = require("@prisma/client");
		const prisma = new PrismaClient();
		if (prisma.adminUser) {
			const user = await prisma.adminUser.upsert({
				where: { email },
				update: {
					passwordHash,
					name,
					role,
				},
				create: {
					email,
					passwordHash,
					name,
					role,
				},
			});
			console.log(`✓ Admin user successfully seeded in AWS RDS: ${user.email}`);
			await prisma.$disconnect();
			return;
		}
	} catch (err) {
		console.log("Prisma client model not ready, using direct connection fallback...");
	}

	// Fallback using pg
	const { Client } = require("pg");
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false,
		},
	});

	await client.connect();
	const query = `
		INSERT INTO admin_users (id, email, "passwordHash", name, role, "createdAt", "updatedAt")
		VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
		ON CONFLICT (email)
		DO UPDATE SET "passwordHash" = $2, name = $3, role = $4, "updatedAt" = NOW()
		RETURNING id, email, name, role;
	`;

	const res = await client.query(query, [email, passwordHash, name, role]);
	console.log(`✓ Admin user successfully seeded in AWS RDS: ${res.rows[0].email}`);
	await client.end();
}

main().catch((err) => {
	console.error("Failed to seed admin user:", err);
	process.exit(1);
});
