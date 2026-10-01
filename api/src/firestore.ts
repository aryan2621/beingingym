import { SignJWT, importPKCS8 } from 'jose';
import type { Bindings } from './types';

/**
 * Minimal Firestore client over the REST API.
 * `firebase-admin` depends on Node APIs that Workers don't provide, so we sign a
 * service-account JWT ourselves and exchange it for a Google OAuth access token.
 */

type FirestoreValue =
    | { nullValue: null }
    | { booleanValue: boolean }
    | { integerValue: string }
    | { doubleValue: number }
    | { stringValue: string }
    | { timestampValue: string }
    | { arrayValue: { values?: FirestoreValue[] } }
    | { mapValue: { fields?: Record<string, FirestoreValue> } };

type FirestoreDocument = { name: string; fields?: Record<string, FirestoreValue> };

export type Doc = Record<string, unknown> & { id: string };

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/datastore';

let cachedToken: { email: string; token: string; expiresAt: number } | null = null;

async function getAccessToken(env: Bindings): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (cachedToken && cachedToken.email === env.FIREBASE_CLIENT_EMAIL && cachedToken.expiresAt - 60 > now) {
        return cachedToken.token;
    }

    // Secrets pasted from the JSON key keep literal "\n" sequences.
    const privateKey = await importPKCS8(env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), 'RS256');
    const assertion = await new SignJWT({ scope: SCOPE })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuer(env.FIREBASE_CLIENT_EMAIL)
        .setSubject(env.FIREBASE_CLIENT_EMAIL)
        .setAudience(TOKEN_URL)
        .setIssuedAt(now)
        .setExpirationTime(now + 3600)
        .sign(privateKey);

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    });
    if (!res.ok) {
        throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
    }
    const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = { email: env.FIREBASE_CLIENT_EMAIL, token: access_token, expiresAt: now + expires_in };
    return access_token;
}

function encodeValue(value: unknown): FirestoreValue {
    if (value === null || value === undefined) return { nullValue: null };
    if (value instanceof Date) return { timestampValue: value.toISOString() };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    if (typeof value === 'string') return { stringValue: value };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
    if (typeof value === 'object') return { mapValue: { fields: encodeFields(value as Record<string, unknown>) } };
    throw new Error(`Unsupported Firestore value: ${typeof value}`);
}

function encodeFields(data: Record<string, unknown>): Record<string, FirestoreValue> {
    const fields: Record<string, FirestoreValue> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) fields[key] = encodeValue(value);
    }
    return fields;
}

function decodeValue(value: FirestoreValue): unknown {
    if ('nullValue' in value) return null;
    if ('booleanValue' in value) return value.booleanValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return value.doubleValue;
    if ('stringValue' in value) return value.stringValue;
    if ('timestampValue' in value) return value.timestampValue;
    if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decodeValue);
    if ('mapValue' in value) return decodeFields(value.mapValue.fields ?? {});
    return null;
}

function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function toDoc(document: FirestoreDocument): Doc {
    const id = decodeURIComponent(document.name.split('/').pop()!);
    return { ...decodeFields(document.fields ?? {}), id };
}

export class FirestoreError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
    }
}

export type RangeFilter = { field: string; from?: Date; to?: Date };

export class Firestore {
    private base: string;

    constructor(private env: Bindings) {
        this.base = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
    }

    private url(segments: string[], suffix = '') {
        // An empty path addresses the database root, e.g. `documents:runQuery` for top-level collections.
        const path = segments.length ? `/${segments.map(encodeURIComponent).join('/')}` : '';
        return `${this.base}${path}${suffix}`;
    }

    private async request<T>(url: string, init: RequestInit = {}): Promise<T | null> {
        const token = await getAccessToken(this.env);
        const res = await fetch(url, {
            ...init,
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new FirestoreError(res.status, `Firestore ${res.status}: ${await res.text()}`);
        const text = await res.text();
        return text ? (JSON.parse(text) as T) : null;
    }

    async get(segments: string[]): Promise<Doc | null> {
        const document = await this.request<FirestoreDocument>(this.url(segments));
        return document ? toDoc(document) : null;
    }

    /** Creates a document; fails if it already exists. */
    async create(segments: string[], data: Record<string, unknown>): Promise<Doc> {
        const document = await this.request<FirestoreDocument>(this.url(segments, '?currentDocument.exists=false'), {
            method: 'PATCH',
            body: JSON.stringify({ fields: encodeFields(data) }),
        });
        return toDoc(document!);
    }

    /**
     * Writes only the given fields. With `mustExist`, returns null when the document is missing
     * instead of creating it.
     */
    async update(segments: string[], data: Record<string, unknown>, { mustExist = false } = {}): Promise<Doc | null> {
        const params = new URLSearchParams();
        for (const key of Object.keys(data)) {
            if (data[key] !== undefined) params.append('updateMask.fieldPaths', key);
        }
        if (mustExist) params.set('currentDocument.exists', 'true');
        try {
            const document = await this.request<FirestoreDocument>(this.url(segments, `?${params}`), {
                method: 'PATCH',
                body: JSON.stringify({ fields: encodeFields(data) }),
            });
            return document ? toDoc(document) : null;
        } catch (err) {
            // A failed `exists=true` precondition comes back as 404 (handled above) or 400 FAILED_PRECONDITION.
            if (mustExist && err instanceof FirestoreError && err.status === 400 && err.message.includes('FAILED_PRECONDITION')) return null;
            throw err;
        }
    }

    /** Deletes a document; returns false when it did not exist. */
    async delete(segments: string[]): Promise<boolean> {
        try {
            await this.request(this.url(segments, '?currentDocument.exists=true'), { method: 'DELETE' });
            return true;
        } catch (err) {
            if (err instanceof FirestoreError && (err.status === 404 || err.message.includes('FAILED_PRECONDITION'))) return false;
            throw err;
        }
    }

    /**
     * Lists a subcollection of `parent`, optionally limited to a timestamp range on one field,
     * ordered by that field. A single-field range needs no composite index.
     */
    async list(parent: string[], collectionId: string, range?: RangeFilter, limit = 500): Promise<Doc[]> {
        const filters = [];
        if (range?.from) filters.push(fieldFilter(range.field, 'GREATER_THAN_OR_EQUAL', range.from));
        if (range?.to) filters.push(fieldFilter(range.field, 'LESS_THAN', range.to));

        const structuredQuery: Record<string, unknown> = {
            from: [{ collectionId }],
            limit,
        };
        if (filters.length === 1) structuredQuery.where = filters[0];
        if (filters.length > 1) structuredQuery.where = { compositeFilter: { op: 'AND', filters } };
        if (range) structuredQuery.orderBy = [{ field: { fieldPath: range.field }, direction: 'ASCENDING' }];

        const rows = await this.request<{ document?: FirestoreDocument }[]>(this.url(parent, ':runQuery'), {
            method: 'POST',
            body: JSON.stringify({ structuredQuery }),
        });
        return (rows ?? []).flatMap((row) => (row.document ? [toDoc(row.document)] : []));
    }

    /** Lists documents of a collection under `parent` (`[]` for top-level) whose `field` equals `value`. */
    async findEqual(parent: string[], collectionId: string, field: string, value: unknown, limit = 500): Promise<Doc[]> {
        const rows = await this.request<{ document?: FirestoreDocument }[]>(this.url(parent, ':runQuery'), {
            method: 'POST',
            body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], where: fieldFilter(field, 'EQUAL', value), limit } }),
        });
        return (rows ?? []).flatMap((row) => (row.document ? [toDoc(row.document)] : []));
    }
}

function fieldFilter(fieldPath: string, op: string, value: unknown) {
    return { fieldFilter: { field: { fieldPath }, op, value: encodeValue(value) } };
}
