import { Bot, MessageSquare, Send, X } from "lucide-react";
import { CHATBOT_WIDGET } from "./chatbotData";
import "./chatbot.css";

export default function Chatbot({
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
        aria-label={CHATBOT_WIDGET.openAriaLabel}
      >
        <Bot />
      </button>

      {chatOpen ? (
        <div className="chat-shell">
          <div className="chat-head">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} />
              <p className="font-heading">{CHATBOT_WIDGET.title}</p>
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
              aria-label={CHATBOT_WIDGET.closeAriaLabel}
              title={CHATBOT_WIDGET.closeTitle}
            >
              <X size={14} />
            </button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="chat-input"
              placeholder={CHATBOT_WIDGET.inputPlaceholder}
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
