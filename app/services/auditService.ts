import { AuditConfig, DonePayload, Result } from "../types/audit";

export async function runAudit(
  config: AuditConfig,
  onResult: (result: Result, index: number, total: number) => void,
  onDone: (payload: DonePayload) => void,
  onError: (index: number, query: string) => void
) {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split("\n").filter((l) => l.startsWith("data: "));

    for (const line of lines) {
      const json = JSON.parse(line.replace("data: ", ""));

      if (json.type === "result") {
        onResult(json.result, json.index, json.total);
      }

      if (json.type === "done") {
        onDone(json);
      }

      if (json.type === "error") {
        onError(json.index, json.query);
      }
    }
  }
}