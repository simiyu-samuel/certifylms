import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

async function migrate() {
	const sql = readFileSync(
		join(__dirname, "..", "lib", "migrations", "001_initial.sql"),
		"utf-8",
	);

	try {
		await pool.query(sql);
		console.log("Migration ran successfully");
	} catch (err) {
		console.error("Migration failed:", err);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

migrate();
