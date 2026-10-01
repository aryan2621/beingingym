import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import type { ValidationTargets } from 'hono';
import { z } from 'zod';

/** zValidator that answers 400 with the first issue instead of the raw zod error object. */
export const validate = <T extends z.ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) =>
    zValidator(target, schema, (result) => {
        if (!result.success) {
            const issue = result.error.issues[0];
            const path = issue.path.join('.');
            throw new HTTPException(400, { message: path ? `${path}: ${issue.message}` : issue.message });
        }
    });

export const isoDate = z.coerce.date();

/** Optional `from`/`to` query params (ISO strings) used by list endpoints. */
export const rangeQuery = z
    .object({ from: isoDate.optional(), to: isoDate.optional() })
    .refine((q) => !q.from || !q.to || q.from < q.to, { message: '`from` must be before `to`' });
