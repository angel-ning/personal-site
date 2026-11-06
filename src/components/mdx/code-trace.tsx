import traces from "./data/py-traces.json";
import { CodeTraceView } from "./code-trace-view";

export type PyTraceStep = {
  line: number;
  end?: number;
  vars: [string, string, string][];
  out: string;
  error?: string;
  cond?: boolean;
  loop?: "next" | "done";
};

export type PyTrace = {
  id: string;
  title: string;
  source: string;
  mine: boolean;
  mock: boolean;
  setupNote: string;
  code: string[];
  notes: string[];
  steps: PyTraceStep[];
};

// Server side: pick one recorded run out of py-traces.json (built by scripts/py-traces/build.py)
// so each page only ships the traces it uses.
export function CodeTrace({ id }: { id: string }) {
  const trace = (traces as unknown as Record<string, PyTrace>)[id];
  if (!trace) return <p className="text-[13px] text-fg-3">（找不到代码运行记录：{id}）</p>;
  return <CodeTraceView trace={trace} />;
}
