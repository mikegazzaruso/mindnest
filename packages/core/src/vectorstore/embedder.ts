// Dependency injection: the consumer (Next.js app) provides the transformers
// loader so Turbopack doesn't try to statically bundle @huggingface/transformers.
// The app uses `createRequire + /* turbopackIgnore */` to load the CJS entry
// (the ESM entry has an interop issue with onnxruntime-common).
type TransformersModule = {
  pipeline: (
    task: string,
    model: string,
    opts: Record<string, unknown>,
  ) => Promise<unknown>;
};

let transformersLoader: (() => TransformersModule) | null = null;

export function registerTransformersLoader(fn: () => TransformersModule): void {
  transformersLoader = fn;
}

let pipeline: unknown = null;

async function getEmbedder() {
  if (!pipeline) {
    if (!transformersLoader) {
      throw new Error(
        "transformers loader not registered — call registerTransformersLoader() at app startup",
      );
    }
    const transformers = transformersLoader();
    pipeline = await transformers.pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { dtype: "fp32" },
    );
  }
  return pipeline as (
    text: string,
    opts: Record<string, unknown>,
  ) => Promise<{ tolist: () => number[][] }>;
}

export async function embed(texts: string[]): Promise<number[][]> {
  const embedder = await getEmbedder();
  const results: number[][] = [];

  for (const text of texts) {
    // Truncate to ~2000 chars to stay within the model's token limit
    const truncated = text.slice(0, 2000);
    const output = await embedder(truncated, {
      pooling: "mean",
      normalize: true,
    });
    results.push(output.tolist()[0]);
  }

  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
