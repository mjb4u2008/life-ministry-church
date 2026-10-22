import { kv } from "@vercel/kv";

type RevisionEvaluator = (script: string, keys: string[], args: string[]) => Promise<unknown>;

const evaluate: RevisionEvaluator = (script, keys, args) => kv.eval(script, keys, args);

// Success and conflict must have different discriminators: a concurrent writer
// normally advances exactly one revision, which is also our proposed revision.
export async function compareAndSetRevision<T>(
  key: string,
  expectedRevision: number,
  value: T,
  evaluator: RevisionEvaluator = evaluate,
): Promise<{ saved: boolean; actualRevision: number }> {
  const result = await evaluator(`
    local current = redis.call("GET", KEYS[1])
    if current then
      local actual = tonumber(cjson.decode(current).revision) or 0
      if actual ~= tonumber(ARGV[1]) then return {0, actual} end
    elseif tonumber(ARGV[1]) ~= 0 then return {0, -1} end
    redis.call("SET", KEYS[1], ARGV[2])
    return {1, tonumber(ARGV[1]) + 1}
  `, [key], [String(expectedRevision), JSON.stringify(value)]);

  if (
    !Array.isArray(result) || result.length !== 2 ||
    (result[0] !== 0 && result[0] !== 1) || !Number.isSafeInteger(result[1]) ||
    result[1] < -1 || (result[0] === 1 && result[1] !== expectedRevision + 1)
  ) throw new Error("Invalid revision storage response");

  return { saved: result[0] === 1, actualRevision: result[1] };
}
