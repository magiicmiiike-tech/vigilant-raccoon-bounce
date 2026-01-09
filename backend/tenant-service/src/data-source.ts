import "reflect-metadata";
import { DataSource } from "typeorm";
import { Tenant } from "./entities/Tenant";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "tenants",
    synchronize: true, // Don't use in production
    logging: false,
    entities: [Tenant],
    migrations: [],
    subscribers: [],
});
