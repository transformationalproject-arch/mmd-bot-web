import { useState, useRef, useEffect } from "react"; import Head from "next/head";


const TONES = [
  { id: "warm", label: "Warm & Supportive", emoji: "🌿" },
  { id: "bold", label: "Bold & Direct", emoji: "⚡" },
  { id: "gentle", label: "Gentle & Reflective", emoji: "🕊️" },
  { id: "motivational", label: "Motivational", emoji: "🔥" },
];

export default function MMDBotClient() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome. I'm MMD Bot, your personal coaching companion. This space is for you. No judgement, just unconditional positive regard and honest support rooted in Myrsini's coaching methodology. What's on your mind today? 🦋" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTone, setActiveTone] = useState("warm");
  const [showTones, setShowTones] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

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
          role: "Coach Support",
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

  const activeToneObj = TONES.find((t) => t.id === activeTone); useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);


  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Inter', sans-serif", background: "#eaf6f1", maxWidth: "680px", margin: "0 auto" }}>
      
      <div style={{ background: "white", borderBottom: "1px solid #e0f0ec", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 2px 12px rgba(82,165,172,0.08)" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #52a5ac, #3d8a91)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🦋</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "700", color: "#1a1a1a", fontSize: "16px" }}>MMD Coaching Bot</div>
          <div style={{ fontSize: "11px", color: "#52a5ac", fontWeight: "500", letterSpacing: "0.3px" }}>coaching in your pocket</div>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowTones(!showTones)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: "20px", border: "1.5px solid #52a5ac", background: showTones ? "#52a5ac" : "white", color: showTones ? "white" : "#52a5ac", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
            <span>{activeToneObj.emoji}</span>
            <span>{activeToneObj.label.split(" ")[0]}</span>
            <span style={{ fontSize: "10px" }}>▾</span>
          </button>
          {showTones && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "white", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #e0f0ec", padding: "8px", zIndex: 100, minWidth: "200px" }}>
              {TONES.map((tone) => (
                <button key={tone.id} onClick={() => { setActiveTone(tone.id); setShowTones(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", borderRadius: "8px", border: "none", background: activeTone === tone.id ? "#eaf6f1" : "transparent", color: activeTone === tone.id ? "#52a5ac" : "#444", fontWeight: activeTone === tone.id ? "600" : "400", fontSize: "13px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: "16px" }}>{tone.emoji}</span>{tone.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, #52a5ac 0%, #3d8a91 100%)", padding: "10px 20px", textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.85)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "500" }}>
        #TheTransformationalProject
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "8px", alignItems: "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #52a5ac, #3d8a91)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>🦋</div>
            )}
            <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #dd226e, #c41d60)" : "white", color: msg.role === "user" ? "white" : "#1a1a1a", fontSize: "14px", lineHeight: "1.7", boxShadow: msg.role === "user" ? "0 2px 12px rgba(221,34,110,0.2)" : "0 2px 10px rgba(0,0,0,0.06)" }}
              dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
          </div>
        ))}

        {streamingText && (
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #52a5ac, #3d8a91)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>🦋</div>
            <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "white", fontSize: "14px", lineHeight: "1.7", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
              dangerouslySetInnerHTML={{ __html: formatMessage(streamingText) }} />
          </div>
        )}

        {loading && !streamingText && (
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #52a5ac, #3d8a91)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>🦋</div>
            <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", gap: "5px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#52a5ac", animation: `bounce 1.2s infinite ${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ background: "white", borderTop: "1px solid #e0f0ec", borderBottom: "1px solid #e0f0ec", padding: "8px 20px", textAlign: "center", fontSize: "11px", color: "#dd226e", fontStyle: "italic", fontWeight: "500" }}>
        "Stop second-guessing. Start trusting yourself." 🌿
      </div>

      <div style={{ background: "white", padding: "14px 16px 20px", boxShadow: "0 -2px 12px rgba(82,165,172,0.06)" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", background: "#eaf6f1", borderRadius: "16px", padding: "10px 10px 10px 16px", border: "1.5px solid #c8e8e4" }}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Share what's on your mind..." rows={1}
            style={{ flex: 1, border: "none", background: "transparent", resize: "none", fontSize: "14px", lineHeight: "1.5", color: "#1a1a1a", outline: "none", fontFamily: "inherit", maxHeight: "100px" }} />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            style={{ width: "38px", height: "38px", borderRadius: "12px", border: "none", background: loading || !input.trim() ? "#c8e8e4" : "linear-gradient(135deg, #dd226e, #c41d60)", color: "white", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
        </div>
        <div style={{ textAlign: "center", marginTop: "8px", fontSize: "10px", color: "#aaa" }}>
          This is a safe, judgment-free space 🦋 · MMD Coaching © 2026
        </div>
      </div>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#52a5ac" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MMD Bot" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </Head>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #c8e8e4; border-radius: 3px; }
      `}</style>
    </div>
  );
}
