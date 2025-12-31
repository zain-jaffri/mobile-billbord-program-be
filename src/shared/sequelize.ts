import { Sequelize } from "sequelize";
import { config } from "./config";

// Single Sequelize instance shared across the app.
export const sequelize = new Sequelize({
  dialect: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  dialectOptions: config.db.ssl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : undefined,
  // Log SQL only in development to reduce noise in production.
  logging: config.env === "development" ? console.log : false,
});
