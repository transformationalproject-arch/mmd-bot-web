import { useState, useRef, useEffect } from "react";
import Head from "next/head";
const ROLES = [
  { id: "coach", label: "Coach Support", icon: "🧭" },
  { id: "social", label: "Social Media", icon: "📱" },
  { id: "podcast", label: "Podcast", icon: "🎙️" },
  { id: "copy", label: "Copywriter", icon: "✍️" },
  { id: "substack", label: "Substack", icon: "📝" },
  { id: "course", label: "Course Creator", icon: "📚" },
  { id: "email", label: "Email Strategy", icon: "📧" },
  { id: "ads", label: "Ads", icon: "📢" },
];

const TONES = [
  { id: "warm", label: "Warm & Motivational" },
  { id: "bold", label: "Bold & Edgy" },
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
];

export default function MMDBot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome! I'm MMD Bot — your intelligent assistant powered by Myrsini's coaching methodology. How can I support you today? 🦋" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState("coach");
  const [activeTone, setActiveTone] = useState("warm");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);


  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamingText("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          role: ROLES.find((r) => r.id === activeRole)?.label,
          tone: TONES.find((t) => t.id === activeTone)?.label,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                setStreamingText(fullText);
              }
            } catch {}
          }
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
      setStreamingText("");
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "#eaf6f1" }}>
      {sidebarOpen && (
        <div style={{ width: "260px", background: "white", borderRight: "1px solid #e0f0ec", display: "flex", flexDirection: "column", boxShadow: "2px 0 12px rgba(82,165,172,0.08)" }}>
          <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid #eaf6f1", background: "linear-gradient(135deg, #52a5ac 0%, #3d8a91 100%)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>🦋</span>
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "18px" }}>MMD Bot</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Coaching Assistant</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px 16px 12px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#52a5ac", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: "10px", paddingLeft: "4px" }}>I'm working on...</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {ROLES.map((role) => (
                <button key={role.id} onClick={() => setActiveRole(role.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", border: "none", cursor: "pointer", background: activeRole === role.id ? "#eaf6f1" : "transparent", color: activeRole === role.id ? "#52a5ac" : "#666", fontWeight: activeRole === role.id ? "600" : "400", fontSize: "13.5px", textAlign: "left", borderLeft: activeRole === role.id ? "3px solid #52a5ac" : "3px solid transparent" }}>
                  <span style={{ fontSize: "16px" }}>{role.icon}</span>{role.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "12px 16px 20px", marginTop: "auto", borderTop: "1px solid #eaf6f1" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#52a5ac", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: "10px", paddingLeft: "4px" }}>Tone</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {TONES.map((tone) => (
                <button key={tone.id} onClick={() => setActiveTone(tone.id)} style={{ padding: "7px 12px", borderRadius: "6px", border: "1px solid", borderColor: activeTone === tone.id ? "#52a5ac" : "#e0f0ec", cursor: "pointer", background: activeTone === tone.id ? "#52a5ac" : "white", color: activeTone === tone.id ? "white" : "#666", fontSize: "12.5px", fontWeight: activeTone === tone.id ? "600" : "400", textAlign: "left" }}>
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "14px 16px", background: "#eaf6f1", borderTop: "1px solid #e0f0ec", fontSize: "11px", color: "#52a5ac", fontStyle: "italic", textAlign: "center", fontWeight: "500" }}>
            Do no harm. Take no shit. 🦋
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ background: "white", borderBottom: "1px solid #e0f0ec", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 2px 8px rgba(82,165,172,0.06)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#52a5ac" }}>☰</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "700", color: "#1a1a1a", fontSize: "15px" }}>{ROLES.find(r => r.id === activeRole)?.icon} {ROLES.find(r => r.id === activeRole)?.label}</div>
            <div style={{ fontSize: "12px", color: "#52a5ac", fontWeight: "500" }}>{TONES.find(t => t.id === activeTone)?.label} tone · MMD Coaching</div>
          </div>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#52a5ac", boxShadow: "0 0 0 3px rgba(82,165,172,0.2)" }} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "10px", alignItems: "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #52a5ac, #3d8a91)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>🦋</div>
              )}
              <div style={{ maxWidth: "72%", padding: "13px 17px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #dd226e, #c41d60)" : "white", color: msg.role === "user" ? "white" : "#1a1a1a", fontSize: "14px", lineHeight: "1.65", boxShadow: msg.role === "user" ? "0 2px 12px rgba(221,34,110,0.25)" : "0 2px 12px rgba(0,0,0,0.06)" }}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              {msg.role === "user" && (
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #dd226e, #c41d60)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0, color: "white", fontWeight: "700" }}>M</div>
              )}
            </div>
          ))}

          {streamingText && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #52a5ac, #3d8a91)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>🦋</div>
              <div style={{ maxWidth: "72%", padding: "13px 17px", borderRadius: "18px 18px 18px 4px", background: "white", fontSize: "14px", lineHeight: "1.65", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                dangerouslySetInnerHTML={{ __html: formatMessage(streamingText) }} />
            </div>
          )}

          {loading && !streamingText && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #52a5ac, #3d8a91)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🦋</div>
              <div style={{ padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: "5px", alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#52a5ac", animation: `bounce 1.2s infinite ${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ background: "white", borderTop: "1px solid #e0f0ec", padding: "16px 24px", boxShadow: "0 -2px 12px rgba(82,165,172,0.06)" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", background: "#eaf6f1", borderRadius: "16px", padding: "10px 10px 10px 16px", border: "1.5px solid #c8e8e4" }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Ask MMD Bot about ${ROLES.find(r => r.id === activeRole)?.label.toLowerCase()}...`} rows={1}
              style={{ flex: 1, border: "none", background: "transparent", resize: "none", fontSize: "14px", lineHeight: "1.5", color: "#1a1a1a", outline: "none", fontFamily: "inherit", maxHeight: "120px" }} />
            <button onClick={handleSend} disabled={loading || !input.trim()}
              style={{ width: "40px", height: "40px", borderRadius: "12px", border: "none", background: loading || !input.trim() ? "#c8e8e4" : "linear-gradient(135deg, #dd226e, #c41d60)", color: "white", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
          </div>
          <div style={{ textAlign: "center", marginTop: "8px", fontSize: "11px", color: "#aaa" }}>Press Enter to send · Shift+Enter for new line · MMD Coaching © 2026</div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #c8e8e4; border-radius: 3px; }
        <Head>
        <link rel="manifest" href="/manifest-main.json" />
        <meta name="theme-color" content="#52a5ac" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MMD Bot" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </Head>

      `}</style>
    </div>
  );
}
