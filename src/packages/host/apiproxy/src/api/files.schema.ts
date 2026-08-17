/**
 * files domain zod schemas (names derived from map keys).
 */

import { z } from 'zod'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { FileEntry } from './files.ts'
import type { RequestPayload, ResponseValue } from './rpc-map.ts'
import type { Wire } from './rpc.schema.ts'

/** Branded session id (the sessions domain's single-cast precedent). */
const filesSessionIdSchema = z.string().min(1) as unknown as z.ZodType<SessionId>

/** files.list request payload: the absolute directory to list. */
export const filesListRequestSchema = z.object({
  path: z.string().min(1),
}) satisfies z.ZodType<Wire<RequestPayload<'files.list'>>>

/** One file row of a listing. */
export const fileEntrySchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.union([z.literal('file'), z.literal('directory'), z.literal('other')]),
  size: z.number().int().nonnegative().optional(),
  version: z.string().optional(),
  hidden: z.boolean(),
}) satisfies z.ZodType<Wire<FileEntry>>

/** files.list response value. */
export const filesListValueSchema = z.object({
  path: z.string(),
  entries: z.array(fileEntrySchema),
  truncated: z.boolean(),
}) satisfies z.ZodType<Wire<ResponseValue<'files.list'>>>

/** files.read request payload: the absolute file to read. */
export const filesReadRequestSchema = z.object({
  path: z.string().min(1),
}) satisfies z.ZodType<Wire<RequestPayload<'files.read'>>>

/** files.read response value. */
export const filesReadValueSchema = z.object({
  path: z.string(),
  size: z.number().int().nonnegative(),
  version: z.string(),
  content: z.string(),
}) satisfies z.ZodType<Wire<ResponseValue<'files.read'>>>

/** files.write request payload: the session attributing the edit, target, and content. */
export const filesWriteRequestSchema = z.object({
  sessionId: filesSessionIdSchema,
  path: z.string().min(1),
  content: z.string(),
  expectedVersion: z.string().optional(),
}) satisfies z.ZodType<Wire<RequestPayload<'files.write'>>>

/** files.write response value. */
export const filesWriteValueSchema = z.object({
  path: z.string(),
  operation: z.union([z.literal('create'), z.literal('update')]),
  size: z.number().int().nonnegative(),
  version: z.string(),
}) satisfies z.ZodType<Wire<ResponseValue<'files.write'>>>
