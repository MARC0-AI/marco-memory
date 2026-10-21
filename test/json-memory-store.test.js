import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonMemoryStore } from "../src/index.js";

test("persists and retrieves relevant local memories", async () => {
  const storageDir = await mkdtemp(join(tmpdir(), "marco-memory-"));
  const memory = new JsonMemoryStore({ storageDir });

  await memory.remember({ content: "Prince is preparing applications for US master's programs.", metadata: { source: "note" } });
  await memory.remember({ content: "Marco should remain a local-first desktop assistant." });

  const matches = await memory.search("US applications");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].metadata.source, "note");
  assert.match(await readFile(join(storageDir, "memories.json"), "utf8"), /local-first/);
});
