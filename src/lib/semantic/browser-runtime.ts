import { parseSemanticManifest, type SemanticManifest } from "./manifest";

export interface SemanticRuntime {
  readonly manifest: SemanticManifest;
  readonly embeddingsById: ReadonlyMap<string, Float32Array>;
  embedQuery(text: string): Promise<Float32Array>;
}

const MANIFEST_URL = "/semantic-search/manifest.json";
const EMBEDDINGS_URL = "/semantic-search/embeddings.bin";

let cachedRuntime: Promise<SemanticRuntime> | null = null;

async function loadRuntime(): Promise<SemanticRuntime> {
  if (typeof window === "undefined") {
    throw new Error("Semantic search runtime is browser-only.");
  }

  const [manifestResponse, embeddingsResponse] = await Promise.all([
    fetch(MANIFEST_URL),
    fetch(EMBEDDINGS_URL),
  ]);

  if (!manifestResponse.ok) {
    throw new Error(`Failed to fetch semantic manifest (status ${manifestResponse.status}).`);
  }
  if (!embeddingsResponse.ok) {
    throw new Error(`Failed to fetch semantic embeddings (status ${embeddingsResponse.status}).`);
  }

  const manifest = parseSemanticManifest(await manifestResponse.json());
  if (!manifest) {
    throw new Error("Semantic manifest failed validation.");
  }

  const buffer = await embeddingsResponse.arrayBuffer();
  const expectedBytes = manifest.count * manifest.dimensions * Float32Array.BYTES_PER_ELEMENT;
  if (buffer.byteLength !== expectedBytes) {
    throw new Error(
      `Semantic embeddings artifact size (${buffer.byteLength} bytes) does not match manifest (expected ${expectedBytes} bytes).`,
    );
  }

  const flat = new Float32Array(buffer);
  const embeddingsById = new Map<string, Float32Array>();
  manifest.assetIds.forEach((id, index) => {
    embeddingsById.set(id, flat.subarray(index * manifest.dimensions, (index + 1) * manifest.dimensions));
  });

  // Dynamically imported so the model runtime is never part of the initial
  // page bundle — it only loads once something actually needs it.
  const { pipeline } = await import("@huggingface/transformers");
  const extractor = await pipeline("feature-extraction", manifest.modelId, { dtype: "q8" });

  return {
    manifest,
    embeddingsById,
    async embedQuery(text: string) {
      const output = await extractor(text, { pooling: "mean", normalize: true });
      return output.data as Float32Array;
    },
  };
}

/**
 * Lazily loads (once per page session) the local semantic search model plus
 * the precomputed embeddings artifact. Every caller shares the same
 * in-flight/resolved promise — no duplicate downloads regardless of how
 * many components ask for it.
 */
export function getSemanticRuntime(): Promise<SemanticRuntime> {
  if (!cachedRuntime) {
    cachedRuntime = loadRuntime().catch((error: unknown) => {
      cachedRuntime = null; // allow a retry on the next call (e.g. a later search) instead of caching a permanent failure
      throw error;
    });
  }
  return cachedRuntime;
}
