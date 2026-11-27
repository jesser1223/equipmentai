"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const suggestions = [
  "What jobs are on today?",
  "Show outstanding invoices",
  "Create a quote for eight hours of excavator work",
  "Which equipment needs service?",
];

export default function AssistantPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/assistant/conversations");
    if (res.ok) setConversations(await res.json());
  };
  useEffect(() => { load(); }, []);

  const send = async (text = input) => {
    const message = text.trim();
    if (!message) return;
    setError("");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    const res = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not reach the assistant");
      return;
    }
    setConversationId(data.conversationId);
    setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    setPending(data.pending || []);
    load();
  };

  const confirm = async (actionId: string) => {
    const res = await fetch("/api/assistant/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: data.error ? data.error : `Saved. Invoice ${data.invoiceNumber || ""} is a draft.`.trim() }]);
    setPending([]);
  };

  const voice = () => {
    const Speech = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!Speech) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    const rec = new Speech();
    rec.lang = "en-CA";
    rec.onresult = (e: any) => send(e.results[0][0].transcript);
    rec.start();
  };
    setConversationId(c.id);
    setMessages(c.messages || []);
    setPending([]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-xl border border-border bg-card p-3">
        <button onClick={() => { setConversationId(null); setMessages([]); setPending([]); }} className="mb-3 w-full rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">New chat</button>
        <div className="space-y-1">
          {conversations.map((c) => (
            <button key={c.id} onClick={() => open(c)} className="block w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-white/5">{c.title || "Conversation"}</button>
          ))}
        </div>
      </aside>
      <section className="flex min-h-[70vh] flex-col rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-lg font-semibold">AI Assistant</h1>
          <p className="text-xs text-muted-foreground">Ask EquipmentAI to create jobs, quotes, and draft invoices. Sending email and recording payments still need you.</p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!messages.length && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-border px-3 py-1 text-xs">{s}</button>)}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "ml-auto bg-accent text-accent-foreground" : "bg-background"}`}>{m.content}</div>
          ))}
          {pending.map((p) => (
            <div key={p.actionId} className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
              <div className="font-medium">Confirm before saving</div>
              <pre className="mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(p.preview, null, 2)}</pre>
              <button onClick={() => confirm(p.actionId)} className="mt-2 rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">Confirm and save</button>
            </div>
          ))}
          {error && <div className="text-sm text-red-400">{error}</div>}
          {loading && <div className="text-sm text-muted-foreground">Working…</div>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tell EquipmentAI what you need done" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button type="button" onClick={voice} className="rounded-lg border border-border px-3 py-2 text-sm">Voice</button>
          <button disabled={loading} className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground">Send</button>
        </form>
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          Voice input uses your browser. <Link href="/billing" className="text-accent">Billing</Link>
        </div>
      </section>
    </div>
  );
}
