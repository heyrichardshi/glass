/**
 * Public Plaid webhook listener.
 * Sustained non-200 responses cause Plaid to stop delivering.
 */

import * as dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { logger } from "./common/logger";
import {
  verifyPlaidWebhook,
  WebhookVerificationError,
} from "./services/plaidWebhook.service";

dotenv.config();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /**
       * The body exactly as received. Plaid signs these bytes; re-serializing the parsed body
       * does not reproduce them.
       */
      rawBody?: Buffer;
    }
  }
}

if (!process.env.PORT) {
  process.exit(1);
}

const PORT: number = parseInt(process.env.PORT, 10);
const log = logger.child({ component: "webhook" });

const app = express();

app.use(helmet());
app.use(
  express.json({
    limit: "64kb",
    verify: (req, _res, buf) => {
      (req as express.Request).rawBody = buf;
    },
  }),
);

app.get("/health", (_req, res) => {
  res.sendStatus(200);
});

app.post("/webhooks/plaid", async (req, res) => {
  try {
    await verifyPlaidWebhook(req.get("Plaid-Verification"), req.rawBody);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      log.warn({ reason: error.message }, "rejected webhook");
      res.sendStatus(401);
      return;
    }
    log.error({ err: error }, "failed to verify webhook");
    res.sendStatus(500);
    return;
  }

  log.info(
    {
      webhookType: req.body.webhook_type,
      webhookCode: req.body.webhook_code,
      itemId: req.body.item_id,
    },
    "acknowledged webhook",
  );
  res.sendStatus(200);
});

app.listen(PORT, () => {
  log.info({ port: PORT }, "listening");
});
