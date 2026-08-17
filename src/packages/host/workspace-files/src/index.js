/**
 * Service Definition for the `ctx.workspaceFiles` capability seam: read-only
 * workspace-file access for the web GUI's file panel. The seam has one
 * interaction shape, so the service exposes methods rather than a capability
 * union: `list` reports one directory level (metadata only) and `read`
 * returns one regular text file whole. Every call takes an absolute host path
 * — clients never join path segments themselves — and returns UI-facing
 * display paths. The `-fs` backend implements this over the filesystem
 * capability (`ctx.fs`), so reads observe the same typed errors and freshness
 * versions the tool layer sees, and a later guarded write can reuse the
 * version token from {@link FileContent.version}.
 * @module @deepseek-ai/dsh-host-workspace-files
 */
import { Service } from '@deepseek-ai/cordis';
/** Typed failure thrown by service methods so consumers can map business codes without string matching. */
export class WorkspaceFilesError extends Error {
    code;
    path;
    /**
     * @param code - closed business code of the failure.
     * @param path - the absolute path the failure is about.
     * @param message - operator-facing description; bound details (for example a
     *   read size limit) belong here, not in extra fields.
     */
    constructor(code, path, message) {
        super(message);
        this.code = code;
        this.path = path;
        this.name = 'WorkspaceFilesError';
    }
}
/**
 * Abstract workspace-file access service for the web GUI host. Subclass,
 * implement `list` and `read`, and load the subclass as a plugin — it
 * registers as `ctx.workspaceFiles` (one implementation per context; loading a
 * second throws, cordis' standard duplicate-service behavior).
 */
export class WorkspaceFiles extends Service {
    constructor(ctx) {
        super(ctx, 'workspaceFiles');
    }
}
export default WorkspaceFiles;
//# sourceMappingURL=index.js.map