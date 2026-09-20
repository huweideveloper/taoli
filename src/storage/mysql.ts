import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import mysql, { type FieldPacket, type Pool, type PoolConnection, type QueryResult } from "mysql2/promise";

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  connectionLimit: number;
  connectTimeout: number;
}

const positiveInt = (value: string | undefined, fallback: number, name: string) => {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
};

export const databaseConfigFromEnv = (env: NodeJS.ProcessEnv): DatabaseConfig => ({
  host: env.DB_HOST ?? "127.0.0.1",
  port: positiveInt(env.DB_PORT, 3306, "DB_PORT"),
  database: env.DB_NAME ?? "cex_dex_arbitrage",
  user: env.DB_USER ?? "root",
  password: env.DB_PASSWORD ?? "",
  connectionLimit: positiveInt(env.DB_CONNECTION_LIMIT, 5, "DB_CONNECTION_LIMIT"),
  connectTimeout: positiveInt(env.DB_CONNECT_TIMEOUT_MS, 5_000, "DB_CONNECT_TIMEOUT_MS"),
});

export const loadInitialMigration = async () => readFile(
  fileURLToPath(new URL("./migrations/001_initial.sql", import.meta.url)),
  "utf8",
);

export const loadOpportunityMigration = async () => readFile(
  fileURLToPath(new URL("./migrations/002_opportunities.sql", import.meta.url)),
  "utf8",
);

export class MySqlDatabase {
  private readonly pool: Pool;

  constructor(config: DatabaseConfig = databaseConfigFromEnv(process.env)) {
    this.pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      multipleStatements: true,
    });
  }

  async healthCheck() {
    await this.pool.execute("SELECT 1");
  }

  async runInitialMigration() {
    await this.pool.query(await loadInitialMigration());
  }

  async runMigrations() {
    await this.pool.query(await loadInitialMigration());
    await this.pool.query(await loadOpportunityMigration());
  }

  async execute<T extends QueryResult>(sql: string, values: (string | number | bigint | boolean | Date | null)[] = []): Promise<[T, FieldPacket[]]> {
    return this.pool.execute<T>(sql, values);
  }

  async withTransaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}
