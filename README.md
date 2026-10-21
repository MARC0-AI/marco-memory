# Marco Memory

Local, transparent persistence for Marco. The MVP store keeps notes as a JSON
file on the user's machine and provides lightweight keyword retrieval. It is
intentionally small so it can be replaced later by an encrypted database or
semantic index without changing the assistant contract.

The product source of truth lives in the sibling `marco-docs` repository.

## Usage

```js
import { JsonMemoryStore } from "@marco-ai/memory";

const memory = new JsonMemoryStore({ storageDir: "/safe/local/path" });
await memory.remember({ content: "Prince wants a focused daily plan." });
const relevant = await memory.search("daily plan");
```

The store writes only inside the configured `storageDir`; no network calls are
made.
