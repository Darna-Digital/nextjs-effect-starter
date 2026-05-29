/**
 * Drizzle schema for the Workflow SDK's MySQL world (`@fantasticfour/world-mysql`).
 *
 * This is a faithful, self-contained copy of the world's own table definitions
 * (https://github.com/vinnymac/worlds — packages/world-mysql/src/schema.ts),
 * transcribed against THIS project's drizzle-orm so drizzle-kit can manage the
 * `workflow` schema like any other (generate + migrate). We copy rather than
 * import the package's schema because its precompiled table objects aren't
 * recognised by drizzle-kit, and its published build omits migration SQL.
 *
 * Keep in sync with the installed `@fantasticfour/world-mysql` version. The
 * binary (CBOR) columns are declared as plain `blob` here — the world handles
 * CBOR encode/decode at runtime; only the SQL column type matters for DDL.
 *
 * These use plain `mysqlTable` (the default schema) rather than
 * `mysqlSchema("workflow")`, because drizzle-kit's MySQL support ignores
 * non-default-schema tables. The migration runs against the `workflow` database
 * directly (see drizzle.workflow.config.ts), so the resulting physical tables
 * are `workflow.workflow_*` — exactly what the runtime world reads via its own
 * schema-qualified definitions.
 *
 * Managed via `pnpm world:generate` / `pnpm world:setup` (see drizzle.workflow.config.ts).
 */
import {
  bigint,
  boolean,
  customType,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/** All binary columns (CBOR payloads + raw stream/job data) map to `blob`. */
const blob = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return "blob";
  },
});

const runStatus = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;
const stepStatus = runStatus;
const jobStatus = ["pending", "processing", "failed"] as const;

export const runs = mysqlTable(
  "workflow_runs",
  {
    runId: varchar("id", { length: 255 }).primaryKey(),
    /** @deprecated superseded by the CBOR column */
    outputJson: json("output"),
    output: blob("output_cbor"),
    deploymentId: varchar("deployment_id", { length: 255 }).notNull(),
    status: mysqlEnum("status", runStatus).notNull(),
    workflowName: varchar("name", { length: 255 }).notNull(),
    /** @deprecated */
    executionContextJson: json("execution_context"),
    executionContext: blob("execution_context_cbor"),
    /** @deprecated */
    inputJson: json("input"),
    input: blob("input_cbor"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    startedAt: timestamp("started_at"),
    specVersion: int("spec_version"),
    expiredAt: timestamp("expired_at"),
  },
  (tb) => [
    index("idx_workflow_runs_name").on(tb.workflowName),
    index("idx_workflow_runs_status").on(tb.status),
  ],
);

export const events = mysqlTable(
  "workflow_events",
  {
    eventId: varchar("id", { length: 255 }).primaryKey(),
    eventType: varchar("type", { length: 255 }).notNull(),
    correlationId: varchar("correlation_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    runId: varchar("run_id", { length: 255 }).notNull(),
    /** @deprecated */
    eventDataJson: json("payload"),
    eventData: blob("payload_cbor"),
    specVersion: int("spec_version"),
  },
  (tb) => [
    index("idx_workflow_events_run_id").on(tb.runId),
    index("idx_workflow_events_correlation_id").on(tb.correlationId),
  ],
);

export const steps = mysqlTable(
  "workflow_steps",
  {
    runId: varchar("run_id", { length: 255 }).notNull(),
    stepId: varchar("step_id", { length: 255 }).primaryKey(),
    stepName: varchar("step_name", { length: 255 }).notNull(),
    status: mysqlEnum("status", stepStatus).notNull(),
    /** @deprecated */
    inputJson: json("input"),
    input: blob("input_cbor"),
    /** @deprecated */
    outputJson: json("output"),
    output: blob("output_cbor"),
    error: text("error"),
    attempt: int("attempt").notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    retryAfter: timestamp("retry_after"),
    specVersion: int("spec_version"),
  },
  (tb) => [
    index("idx_workflow_steps_run_id").on(tb.runId),
    index("idx_workflow_steps_status").on(tb.status),
  ],
);

export const hooks = mysqlTable(
  "workflow_hooks",
  {
    runId: varchar("run_id", { length: 255 }).notNull(),
    hookId: varchar("hook_id", { length: 255 }).primaryKey(),
    token: varchar("token", { length: 255 }).notNull(),
    ownerId: varchar("owner_id", { length: 255 }).notNull(),
    projectId: varchar("project_id", { length: 255 }).notNull(),
    environment: varchar("environment", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** @deprecated */
    metadataJson: json("metadata"),
    metadata: blob("metadata_cbor"),
    specVersion: int("spec_version"),
    isWebhook: boolean("is_webhook"),
  },
  (tb) => [
    index("idx_workflow_hooks_run_id").on(tb.runId),
    index("idx_workflow_hooks_token").on(tb.token),
  ],
);

export const streams = mysqlTable(
  "workflow_stream_chunks",
  {
    chunkId: varchar("id", { length: 255 }).notNull(),
    streamId: varchar("stream_id", { length: 255 }).notNull(),
    chunkData: blob("data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    eof: boolean("eof").notNull(),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
  },
  (tb) => [
    primaryKey({ columns: [tb.streamId, tb.chunkId] }),
    index("idx_stream_chunks_sequence").on(tb.streamId, tb.sequence),
  ],
);

export const jobs = mysqlTable(
  "workflow_jobs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    jobId: varchar("job_id", { length: 255 }).notNull().unique(),
    queueName: varchar("queue_name", { length: 255 }).notNull(),
    payload: blob("payload").notNull(),
    status: mysqlEnum("status", jobStatus).notNull().default("pending"),
    attempt: int("attempt").notNull().default(0),
    maxAttempts: int("max_attempts").notNull().default(3),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lockedAt: timestamp("locked_at"),
    lockedBy: varchar("locked_by", { length: 255 }),
    error: text("error"),
    scheduledFor: timestamp("scheduled_for"),
  },
  (tb) => [
    index("idx_jobs_queue_status").on(tb.queueName, tb.status, tb.id),
    index("idx_jobs_scheduled").on(tb.scheduledFor),
  ],
);

export const idempotency = mysqlTable(
  "workflow_job_idempotency",
  {
    idempotencyKey: varchar("idempotency_key", { length: 255 }).primaryKey(),
    messageId: varchar("message_id", { length: 255 }).notNull(),
    queueName: varchar("queue_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (tb) => [index("idx_idempotency_created").on(tb.createdAt)],
);
