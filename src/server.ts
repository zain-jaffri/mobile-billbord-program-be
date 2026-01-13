import { Op } from "sequelize";
import { createApp } from "./app";
import { config } from "./shared/config";
import { initDb } from "./shared/db";
import { sequelize } from "./shared/sequelize";
import { TallyWebhookEvent } from "./modules/webhooks/tallyWebhookEvent.model";

// Bootstrap the server with DB init first to fail fast on bad config.
const start = async () => {
  await initDb();

  const app = createApp();
  // Bind HTTP server after DB connectivity is confirmed.
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });

  const ttlDays = Number(process.env.TALLY_DEDUPE_TTL_DAYS || 30);
  const intervalHours = Number(process.env.TALLY_DEDUPE_CLEANUP_INTERVAL_HOURS || 6);
  if (ttlDays > 0 && intervalHours > 0) {
    let hasDedupeTable: boolean | null = null;
    const getTableName = () => {
      const table = TallyWebhookEvent.getTableName();
      return typeof table === "string" ? table : table.tableName;
    };
    const resolveHasTable = async (): Promise<boolean> => {
      const tableName = getTableName();
      const tables = await sequelize.getQueryInterface().showAllTables();
      return tables.some((table) => {
        if (typeof table === "string") {
          return table === tableName || table.endsWith(`.${tableName}`);
        }
        if (typeof table === "object" && table !== null && "tableName" in table) {
          const name = (table as { tableName?: string }).tableName;
          return name === tableName;
        }
        return false;
      });
    };
    const cleanup = async () => {
      const cutoff = new Date();
      cutoff.setUTCDate(cutoff.getUTCDate() - ttlDays);
      try {
        if (hasDedupeTable === null) {
          hasDedupeTable = await resolveHasTable();
          if (!hasDedupeTable) {
            console.warn(
              `[tally] webhook dedupe cleanup skipped; missing table "${getTableName()}"`
            );
            return;
          }
        }
        if (!hasDedupeTable) {
          return;
        }
        const deleted = await TallyWebhookEvent.destroy({
          where: { receivedAt: { [Op.lt]: cutoff } },
        });
        if (deleted > 0) {
          console.log(`[tally] cleaned ${deleted} webhook dedupe events older than ${ttlDays} days`);
        }
      } catch (error) {
        console.error("[tally] webhook dedupe cleanup failed", error);
      }
    };

    void cleanup();
    setInterval(cleanup, intervalHours * 60 * 60 * 1000);
  }
};

void start();
