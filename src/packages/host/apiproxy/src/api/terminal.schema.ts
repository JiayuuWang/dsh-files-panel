/**
 * terminal domain zod schemas (names derived from map keys).
 */

import { z } from 'zod'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { TerminalOpenValue, TerminalReadValue } from './terminal.ts'
import type { RequestPayload, ResponseValue } from './rpc-map.ts'
import type { Wire } from './rpc.schema.ts'

/** Branded session id (the sessions domain's single-cast precedent). */
const terminalSessionIdSchema = z.string().min(1) as unknown as z.ZodType<SessionId>

/** Client-minted per-session terminal identity (one terminal per pane). */
const terminalIdSchema = z.string().min(1)

/** terminal.open request payload. */
export const terminalOpenRequestSchema = z.object({
  sessionId: terminalSessionIdSchema,
  terminalId: terminalIdSchema,
  cwd: z.string().optional(),
  shell: z.string().optional(),
}) satisfies z.ZodType<Wire<RequestPayload<'terminal.open'>>>

/** terminal.open response value. */
export const terminalOpenValueSchema = z.object({
  pid: z.number().int().positive(),
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
  output: z.string(),
  cursor: z.number().int().nonnegative(),
}) satisfies z.ZodType<Wire<TerminalOpenValue>>

/** terminal.write request payload. */
export const terminalWriteRequestSchema = z.object({
  sessionId: terminalSessionIdSchema,
  terminalId: terminalIdSchema,
  data: z.string(),
}) satisfies z.ZodType<Wire<RequestPayload<'terminal.write'>>>

/** terminal.write response value. */
export const terminalWriteValueSchema = z.object({
  delivered: z.literal(true),
}) satisfies z.ZodType<Wire<ResponseValue<'terminal.write'>>>

/** terminal.read request payload. */
export const terminalReadRequestSchema = z.object({
  sessionId: terminalSessionIdSchema,
  terminalId: terminalIdSchema,
  cursor: z.number().int().nonnegative(),
}) satisfies z.ZodType<Wire<RequestPayload<'terminal.read'>>>

/** terminal.read response value. */
export const terminalReadValueSchema = z.object({
  output: z.string(),
  cursor: z.number().int().nonnegative(),
  truncated: z.boolean(),
  exited: z.boolean(),
}) satisfies z.ZodType<Wire<TerminalReadValue>>

/** terminal.signal request payload. */
export const terminalSignalRequestSchema = z.object({
  sessionId: terminalSessionIdSchema,
  terminalId: terminalIdSchema,
  signal: z.union([z.literal('SIGINT'), z.literal('SIGTERM'), z.literal('SIGKILL'), z.literal('SIGTSTP'), z.literal('SIGHUP')]),
}) satisfies z.ZodType<Wire<RequestPayload<'terminal.signal'>>>

/** terminal.signal response value. */
export const terminalSignalValueSchema = z.object({
  delivered: z.literal(true),
}) satisfies z.ZodType<Wire<ResponseValue<'terminal.signal'>>>

/** terminal.close request payload. */
export const terminalCloseRequestSchema = z.object({
  sessionId: terminalSessionIdSchema,
  terminalId: terminalIdSchema,
}) satisfies z.ZodType<Wire<RequestPayload<'terminal.close'>>>

/** terminal.close response value. */
export const terminalCloseValueSchema = z.object({
  closed: z.literal(true),
}) satisfies z.ZodType<Wire<ResponseValue<'terminal.close'>>>

/** terminal.shells request payload (empty). */
export const terminalShellsRequestSchema = z.object({}) satisfies z.ZodType<Wire<RequestPayload<'terminal.shells'>>>

/** terminal.shells response value. */
export const terminalShellsValueSchema = z.object({
  shells: z.array(z.string()),
}) satisfies z.ZodType<Wire<ResponseValue<'terminal.shells'>>>
