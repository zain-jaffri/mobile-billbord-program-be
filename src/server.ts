import { createApp } from "./app";
import { config } from "./shared/config";
import { initDb } from "./shared/db";

// Bootstrap the server with DB init first to fail fast on bad config.
const start = async () => {
  await initDb();

  const app = createApp();
  // Bind HTTP server after DB connectivity is confirmed.
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
};

void start();
