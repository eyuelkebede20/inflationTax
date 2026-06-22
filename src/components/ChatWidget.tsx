import { useEffect, useRef, useState } from "react";
import { useT } from "../lib/i18n";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || t("chat.error") },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: t("chat.error") }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat-root no-print">
      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            <span>💬 {t("chat.title")}</span>
            <button
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="chat-body" ref={scrollRef}>
            <div className="chat-msg bot">{t("chat.intro")}</div>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === "user" ? "me" : "bot"}`}>
                {m.content}
              </div>
            ))}
            {busy && <div className="chat-msg bot thinking">{t("chat.thinking")}</div>}
          </div>
          <form className="chat-input" onSubmit={send}>
            <input
              type="text"
              placeholder={t("chat.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn" type="submit" disabled={busy || !input.trim()}>
              {t("chat.send")}
            </button>
          </form>
        </div>
      )}
      <button
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("chat.title")}
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
