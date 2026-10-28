import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Bot,
  User,
  Paperclip,
  CheckCircle2,
  Clock,
  ChevronDown,
  Info,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthAccess } from "@/context/AuthAccessContext";

const INITIAL_SUGGESTIONS = [
  "How do I upload the FrontSteps Cases Report?",
  "Where can I find approved FrontSteps policies?",
  "What is the PIP milestone criteria?",
  "Show me my current performance score",
];

const INITIAL_MESSAGES = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Hello! I am your **SiBS Assistant**. I'm here to assist you with FrontSteps operations, reports, policy inquiries, and PMS data. How can I help you today?",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

export default function SibsAssistantChatbot() {
  const { authUser } = useAuthAccess();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("sibs_chatbot_theme") === "dark";
    } catch {
      return false;
    }
  });
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Dragging state for the floating toggle button (offsets from bottom and right)
  const [position, setPosition] = useState({ bottom: 20, right: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialRight: 20, initialBottom: 20 });
  const hasMovedRef = useRef(false);

  const handlePointerDown = (e) => {
    // Left click or primary touch only
    if (e.button !== undefined && e.button !== 0) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialRight: position.right,
      initialBottom: position.bottom,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }

    // Since position is from bottom-right:
    // Moving right (positive deltaX) decreases right offset.
    // Moving down (positive deltaY) decreases bottom offset.
    const newRight = dragStartRef.current.initialRight - deltaX;
    const newBottom = dragStartRef.current.initialBottom - deltaY;

    // Viewport clamp limits (keep button within viewable screen area)
    const maxRight = Math.max(10, window.innerWidth - 180);
    const maxBottom = Math.max(10, window.innerHeight - 60);

    setPosition({
      right: Math.min(Math.max(10, newRight), maxRight),
      bottom: Math.min(Math.max(10, newBottom), maxBottom),
    });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleToggleClick = (e) => {
    // If the user was dragging, don't trigger click-to-open
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen(true);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sibs_chatbot_theme", next ? "dark" : "light");
      } catch (err) {
        console.error("Theme storage error", err);
      }
      return next;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isTyping]);

  // Don't render chatbot if user is on public login page / unauthenticated
  if (!authUser && window.location.pathname === "/login") {
    return null;
  }

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsTyping(true);

    // Simulated response (placeholder until n8n webhook integration)
    setTimeout(() => {
      let botReply = "Thank you for reaching out! I am currently operating in demo mode. Our n8n workflow integration will connect me directly to live PMS queries, policies, and intelligent automations.";
      
      const lower = text.toLowerCase();
      if (lower.includes("case") || lower.includes("upload")) {
        botReply = "To upload Cases Reports, navigate to **FrontSteps > Reporting & Data > Data Management**. Drag and drop your `.csv` or `.xlsx` file into the Cases Report dropzone.";
      } else if (lower.includes("policy") || lower.includes("policies")) {
        botReply = "All official governing documents are organized in the **Policy Documents Repository** inside FrontSteps Data Management. You can view, approve, and download active policies anytime.";
      } else if (lower.includes("pip") || lower.includes("pmp") || lower.includes("milestone")) {
        botReply = "The **FrontSteps Performance Incentive Program (PIP)** and **Quarterly Retention (Milestone)** policies define operational benchmark targets and retention criteria. Check the Policies Repository for detailed PDF guides.";
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <aside
      aria-label="SiBS Assistant Chatbot"
      style={{
        bottom: `${position.bottom}px`,
        right: `${position.right}px`,
      }}
      className="fixed z-[999] font-jakarta select-none"
    >
      {/* Floating Toggle Button (Smooth bounce-in with spring physics and full draggable support) */}
      <div
        className={`transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right ${
          !isOpen
            ? "scale-100 opacity-100 translate-y-0 pointer-events-auto shadow-lg"
            : "scale-50 opacity-0 translate-y-3 pointer-events-none absolute bottom-0 right-0"
        }`}
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleToggleClick}
          className={`group relative flex items-center gap-2.5 rounded-xl bg-[#042c51] px-4 py-2.5 sm:px-5 sm:py-3 text-white shadow-xl hover:shadow-2xl hover:bg-[#063d70] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 border border-slate-700/50 touch-none select-none ${
            isDragging ? "cursor-grabbing shadow-2xl scale-105" : "cursor-grab"
          }`}
          aria-label="Open SiBS Assistant (Drag to reposition)"
          title="Click to open · Drag to move anywhere"
        >
          {/* Online indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>

          <span className="text-sm font-bold tracking-wide text-white">
            SiBS Assistant
          </span>
        </button>
      </div>

      {/* Chat Window Panel (Sleek fluid scale-up with backdrop blur & spring easing) */}
      <div
        role="region"
        aria-label="SiBS Assistant Window"
        style={{
          transitionProperty: "opacity, transform, width, height, background-color, border-color",
          transitionDuration: "400ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={`flex flex-col overflow-hidden rounded-2xl border shadow-2xl origin-bottom-right will-change-transform ${
          isDarkMode
            ? "border-slate-700/60 bg-[#161f30] text-slate-200"
            : "border-slate-200/90 bg-white text-slate-800"
        } ${
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto translate-y-0 blur-none"
            : "scale-[0.82] opacity-0 pointer-events-none translate-y-6 blur-xs absolute bottom-0 right-0"
        } ${
          isExpanded
            ? "w-[94vw] sm:w-[560px] h-[85vh] max-h-[850px]"
            : "w-[92vw] sm:w-[380px] h-[600px] max-h-[88vh]"
        }`}
      >
          {/* Header Bar */}
          <div
            className={`flex items-center justify-between border-b px-4 py-3 text-white shrink-0 transition-colors ${
              isDarkMode
                ? "border-slate-700/60 bg-[#111927]"
                : "border-slate-700/30 bg-[#042c51]"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white border border-white/20 shadow-xs">
                <Bot size={20} className="text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#042c51]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-white tracking-wide truncate">SiBS Assistant</h3>
                </div>
                <p className="text-xs text-slate-300 font-medium truncate">
                  Ready · FrontSteps & PMS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-200">
              {/* Day / Night Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-2 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                title={isDarkMode ? "Switch to Day mode" : "Switch to Night mode"}
                aria-label={isDarkMode ? "Switch to Day mode" : "Switch to Night mode"}
              >
                {isDarkMode ? (
                  <Sun size={18} className="text-amber-300 hover:rotate-45 transition-transform" />
                ) : (
                  <Moon size={18} className="text-slate-100 hover:-rotate-12 transition-transform" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex rounded-lg p-2 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                title={isExpanded ? "Collapse to standard size" : "Expand size"}
                aria-label={isExpanded ? "Collapse to standard size" : "Expand size"}
              >
                {isExpanded ? <Minimize2 size={18} className="text-white" /> : <Maximize2 size={18} className="text-white" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                title="Close chat"
                aria-label="Close chat"
              >
                <Minus size={20} strokeWidth={2.5} className="text-white" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div
            className={`flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3.5 sibs-scrollbar text-xs transition-colors ${
              isDarkMode ? "bg-[#131b2a]" : "bg-slate-50/60"
            }`}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                      isUser
                        ? isDarkMode ? "bg-[#ea580c] text-white" : "bg-[#ff5c28] text-white"
                        : isDarkMode
                        ? "bg-slate-700/80 text-slate-200 border border-slate-600/50"
                        : "bg-[#042c51] text-white"
                    }`}
                  >
                    {isUser ? <User size={12} /> : <Bot size={12} className={isDarkMode ? "text-slate-200" : "text-white"} />}
                  </div>

                  <div className={`flex flex-col max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                        isUser
                          ? isDarkMode
                            ? "bg-[#ea580c] text-white rounded-tr-xs font-medium shadow-xs"
                            : "bg-[#ff5c28] text-white rounded-tr-xs font-medium"
                          : isDarkMode
                          ? "bg-[#1e293b] text-slate-200 border border-slate-700/60 rounded-tl-xs"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span
                      className={`mt-1 text-[9.5px] font-mono ${
                        isDarkMode ? "text-slate-400" : "text-slate-400"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div
                className={`flex items-center gap-2 text-xs italic ${
                  isDarkMode ? "text-slate-400" : "text-slate-400"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                    isDarkMode ? "bg-slate-700 text-slate-200" : "bg-[#042c51] text-white"
                  }`}
                >
                  <Bot size={10} />
                </div>
                <div
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 shadow-2xs border ${
                    isDarkMode
                      ? "bg-[#1e293b] border-slate-700/60"
                      : "bg-white border-slate-200/80"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          {messages.length <= 2 && (
            <div
              className={`px-3 py-2 border-t flex flex-wrap gap-1.5 shrink-0 transition-colors ${
                isDarkMode
                  ? "bg-[#161f30] border-slate-700/60"
                  : "bg-white border-slate-100"
              }`}
            >
              {INITIAL_SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(sug)}
                  className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-colors cursor-pointer text-left truncate max-w-full ${
                    isDarkMode
                      ? "border-slate-700 bg-slate-800/80 hover:bg-slate-700/90 text-slate-300"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`flex items-center gap-2 border-t p-2.5 shrink-0 transition-colors ${
              isDarkMode
                ? "bg-[#161f30] border-slate-700/60"
                : "bg-white border-slate-100"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask SiBS Assistant..."
              className={`flex-1 rounded-xl border px-3.5 py-2 text-xs outline-none transition-colors ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800/90 text-slate-200 placeholder:text-slate-400 focus:border-[#ea580c] focus:bg-slate-800"
                  : "border-slate-200 bg-slate-50/70 text-slate-800 placeholder:text-slate-400 focus:border-[#ff5c28] focus:bg-white"
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#042c51] text-white hover:bg-[#063d70] disabled:opacity-40 disabled:hover:bg-[#042c51] transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </aside>
    );
  }
