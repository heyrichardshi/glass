/**
 * Public Plaid webhook listener.
 * Sustained non-200 responses cause Plaid to stop delivering.
 */

import * as dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { logger } from "./common/logger";

dotenv.config();

if (!process.env.PORT) {
  process.exit(1);
}

const PORT: number = parseInt(process.env.PORT, 10);
const log = logger.child({ component: "webhook" });

const app = express();

app.use(helmet());

app.get("/health", (_req, res) => {
  res.sendStatus(200);
});

app.post("/webhooks/plaid", (_req, res) => {
  log.info("acknowledged webhook");
  res.sendStatus(200);
});

app.listen(PORT, () => {
  log.info({ port: PORT }, "listening");
});
