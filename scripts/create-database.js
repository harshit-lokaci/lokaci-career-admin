const { Client } = require("pg");

async function main() {
	console.log("Connecting to AWS RDS instance to check/create lokaci_careers database...");

	const connectionString =
		process.env.DATABASE_URL ||
		(process.env.PG_HOST
			? `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT || 5432}/propking_db`
			: null);

	if (!connectionString) {
		console.error("ERROR: DATABASE_URL environment variable is required.");
		process.exit(1);
	}

	const client = new Client({
		connectionString,
		ssl: {
			rejectUnauthorized: false,
		},
	});

	try {
		await client.connect();
		console.log("Connected to RDS server successfully!");

		const checkDb = await client.query(
			"SELECT 1 FROM pg_database WHERE datname = 'lokaci_careers'"
		);

		if (checkDb.rowCount === 0) {
			console.log("Creating separate database: lokaci_careers ...");
			await client.query("CREATE DATABASE lokaci_careers");
			console.log("SUCCESS: Database lokaci_careers has been created!");
		} else {
			console.log("Database lokaci_careers already exists.");
		}
	} catch (err) {
		console.error("ERROR while creating database:", err.message);
		process.exit(1);
	} finally {
		await client.end();
		console.log("Connection closed cleanly.");
	}
}

main();
