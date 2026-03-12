import { Bot, MessageSquare, Send, X } from "lucide-react";

export default function ChatWidget({
  chatOpen,
  setChatOpen,
  messages,
  chatLoading,
  typingResponse,
  sendChat,
  chatInput,
  setChatInput
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="chat-fab"
        aria-label="Open chatbot"
      >
        <Bot />
      </button>

      {chatOpen ? (
        <div className="chat-shell">
          <div className="chat-head">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} />
              <p className="font-heading">Portfolio AI Chat</p>
            </div>
          </div>
          <div className="chat-body">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`chat-bubble ${m.role === "user" ? "chat-user" : "chat-bot"}`}
              >
                {m.text}
              </div>
            ))}
            {chatLoading && typingResponse ? (
              <div className="chat-bubble chat-bot">{typingResponse}</div>
            ) : null}
          </div>
          <form onSubmit={sendChat} className="chat-form">
            <button
              type="button"
              className="chat-close chat-close-inline"
              onClick={() => setChatOpen(false)}
              aria-label="Close chatbot"
              title="Close chat"
            >
              <X size={14} />
            </button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="chat-input"
              placeholder="Ask about skills, projects, contact..."
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="chat-send"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
