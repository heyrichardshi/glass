/**
 * Required External Modules
 */

import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler";
import accounts from "./routes/account.routes";
import transactions from "./routes/transaction.routes";
import categories from "./routes/category.routes";
import tags from "./routes/tag.routes";
import merchants from "./routes/merchant.routes";
import reports from "./routes/report.routes";

dotenv.config();

/**
 * App Variables
 */

if (!process.env.PORT) {
  process.exit(1);
}

const PORT: number = parseInt(process.env.PORT as string, 10);

const app = express();

/**
 *  App Configuration
 */

app.use(helmet());
app.use(cors());
app.use(express.json());

// Middleware that loads environment variables so routers can access them.
app.use(function (req, res, next) {
  next();
});

app.use("/", accounts);
app.use("/", transactions);
app.use("/", categories);
app.use("/", tags);
app.use("/", merchants);
app.use("/", reports);

app.use(errorHandler);

/**
 * Server Activation
 */

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
