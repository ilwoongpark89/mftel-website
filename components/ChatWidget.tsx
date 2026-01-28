"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const chatTexts = {
  EN: {
    replyTime: "Usually replies in a day",
    leaveMessage: "Leave us a message and",
    getBack: "we'll get back to you.",
    nameLabel: "Name",
    nameOptional: "(optional)",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailOptional: "(optional)",
    emailPlaceholder: "your@email.com",
    startChat: "Start Chat",
    anonymousNote: "You can send messages anonymously",
    welcomeMessage: "Hello! Thank you for your interest in MFTEL. You can leave your message in this chat, and we will respond to your email. Thanks!",
    sentWithEmail: "Your message has been sent. We'll get back to you via email soon.",
    sentWithoutEmail: "Your message has been sent. Please check back later for updates.",
    sendFailed: "Failed to send message. Please try again.",
    typePlaceholder: "Type your message...",
    newConversation: "New conversation",
  },
  KR: {
    replyTime: "보통 하루 내 답변드립니다",
    leaveMessage: "메시지를 남겨주시면",
    getBack: "빠르게 연락드리겠습니다.",
    nameLabel: "이름",
    nameOptional: "(선택)",
    namePlaceholder: "이름을 입력하세요",
    emailLabel: "이메일",
    emailOptional: "(선택)",
    emailPlaceholder: "your@email.com",
    startChat: "대화 시작",
    anonymousNote: "익명으로도 메시지를 보낼 수 있습니다",
    welcomeMessage: "안녕하세요! MFTEL에 관심 가져주셔서 감사합니다. 이 채팅으로 메시지를 남겨주시면 이메일로 답변드리겠습니다!",
    sentWithEmail: "메시지가 전송되었습니다. 이메일로 답변드리겠습니다.",
    sentWithoutEmail: "메시지가 전송되었습니다. 나중에 다시 확인해주세요.",
    sendFailed: "메시지 전송에 실패했습니다. 다시 시도해주세요.",
    typePlaceholder: "메시지를 입력하세요...",
    newConversation: "새 대화",
  }
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ text: string; isUser: boolean; time: string }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<"info" | "chat">("info");
  const [shouldBounce, setShouldBounce] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  const t = chatTexts[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Contact 섹션 감지해서 바운스 효과
  useEffect(() => {
    const handleScroll = () => {
      const contactSection = document.getElementById('contact');
      if (contactSection && !isOpen) {
        const rect = contactSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible && !shouldBounce) {
          setShouldBounce(true);
          // 떨림 후 리셋
          setTimeout(() => setShouldBounce(false), 600);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen, shouldBounce]);

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("chat");
    setMessages([{
      text: t.welcomeMessage,
      isUser: false,
      time: new Date().toLocaleTimeString(language === "KR" ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    const currentTime = new Date().toLocaleTimeString(language === "KR" ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { text: userMessage, isUser: true, time: currentTime }]);
    setMessage("");
    setIsSending(true);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || "Anonymous",
          email: email.trim() || "Not provided",
          message: userMessage
        })
      });

      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: email.trim() ? t.sentWithEmail : t.sentWithoutEmail,
          isUser: false,
          time: new Date().toLocaleTimeString(language === "KR" ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsSending(false);
      }, 800);
    } catch {
      setMessages(prev => [...prev, {
        text: t.sendFailed,
        isUser: false,
        time: new Date().toLocaleTimeString(language === "KR" ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleReset = () => {
    setStep("info");
    setMessages([]);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <>
      {/* Shake Animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) rotate(-8deg); }
          20%, 40%, 60%, 80% { transform: translateX(4px) rotate(8deg); }
        }
      `}</style>

      {/* Chat Window */}
      <div className={`fixed bottom-24 right-6 w-[340px] bg-white rounded-3xl shadow-2xl overflow-hidden z-50 transition-all duration-300 ease-out ${
        isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg tracking-tight">MFTEL</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <p className="text-slate-400 text-xs">{t.replyTime}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {step === "info" ? (
          /* Info Form */
          <form onSubmit={handleStartChat} className="p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            <div className="text-center mb-2">
              <p className="text-gray-600 text-sm">{t.leaveMessage}<br/>{t.getBack}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                  {t.nameLabel} <span className="text-gray-400">{t.nameOptional}</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                  {t.emailLabel} <span className="text-gray-400">{t.emailOptional}</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all placeholder:text-gray-300"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98]"
            >
              {t.startChat}
            </button>
            <p className="text-center text-xs text-gray-400">
              {t.anonymousNote}
            </p>
          </form>
        ) : (
          /* Chat Area */
          <>
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] ${msg.isUser ? "" : "flex gap-2"}`}>
                    {!msg.isUser && (
                      <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white font-bold text-xs">M</span>
                      </div>
                    )}
                    <div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          msg.isUser
                            ? "bg-slate-800 text-white rounded-br-md"
                            : "bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                      <p className={`text-[10px] mt-1 ${msg.isUser ? "text-right" : "text-left"} text-gray-400`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">M</span>
                    </div>
                    <div className="bg-white text-gray-500 px-4 py-3 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2 items-end">
                <button
                  onClick={handleReset}
                  className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  title={t.newConversation}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={t.typePlaceholder}
                    rows={1}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || isSending}
                  className="p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={shouldBounce && !isOpen ? {
          animation: 'shake 0.5s ease-in-out'
        } : undefined}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-xl z-50 transition-all duration-300 flex items-center justify-center group ${
          isOpen
            ? "bg-gray-600 hover:bg-gray-500"
            : "bg-rose-500 hover:bg-rose-600 hover:scale-105 hover:shadow-2xl shadow-rose-500/30"
        }`}
      >
        <div className={`transition-transform duration-300 ${isOpen ? "rotate-0" : "group-hover:rotate-12"}`}>
          {isOpen ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </div>
      </button>
    </>
  );
}
