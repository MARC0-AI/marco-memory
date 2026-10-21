import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const DEFAULT_LIMIT = 5;

/** A small, local-only memory store with deterministic keyword retrieval. */
export class JsonMemoryStore {
  #filePath;
  #entries;

  constructor({ storageDir, filename = "memories.json" } = {}) {
    if (typeof storageDir !== "string" || !storageDir.trim()) {
      throw new TypeError("JsonMemoryStore requires a storageDir.");
    }
    this.#filePath = join(storageDir, filename);
  }

  async remember({ content, metadata = {} }) {
    if (typeof content !== "string" || !content.trim()) {
      throw new TypeError("memory content must be a non-empty string.");
    }
    if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
      throw new TypeError("memory metadata must be an object.");
    }

    const entries = await this.#load();
    const entry = {
      id: crypto.randomUUID(),
      content: content.trim(),
      metadata,
      createdAt: new Date().toISOString()
    };
    entries.push(entry);
    await this.#save(entries);
    return { ...entry, metadata: { ...entry.metadata } };
  }

  async search(query, { limit = DEFAULT_LIMIT } = {}) {
    if (typeof query !== "string") throw new TypeError("query must be a string.");
    if (!Number.isInteger(limit) || limit < 1) throw new TypeError("limit must be a positive integer.");

    const tokens = tokenize(query);
    const entries = await this.#load();
    return entries
      .map((entry) => ({ entry, score: score(entry.content, tokens) }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || right.entry.createdAt.localeCompare(left.entry.createdAt))
      .slice(0, limit)
      .map(({ entry }) => ({ ...entry, metadata: { ...entry.metadata } }));
  }

  async all() {
    const entries = await this.#load();
    return entries.map((entry) => ({ ...entry, metadata: { ...entry.metadata } }));
  }

  async #load() {
    if (this.#entries) return this.#entries;
    try {
      const raw = await readFile(this.#filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Memory file must contain an array.");
      this.#entries = parsed;
    } catch (error) {
      if (error.code === "ENOENT") this.#entries = [];
      else throw new Error(`Could not load Marco memory: ${error.message}`);
    }
    return this.#entries;
  }

  async #save(entries) {
    await mkdir(dirname(this.#filePath), { recursive: true });
    const temporaryPath = `${this.#filePath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.#filePath);
  }
}

function tokenize(value) {
  return [...new Set(value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])];
}

function score(content, tokens) {
  const normalized = content.toLowerCase();
  return tokens.reduce((total, token) => total + (normalized.includes(token) ? 1 : 0), 0);
}
