"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { Meta } from "@/components/ui/typo";

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
    replyTime: "보통 하루 안에 답변드립니다",
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
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ text: string; isUser: boolean; time: string }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<"info" | "chat">("info");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  const t = chatTexts[language];
  const isKR = language === "KR";
  const bodyLeading = isKR ? "leading-[1.75]" : "leading-relaxed";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (pathname === "/team-dashboard") return null;

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
    <div>
      {/* Chat panel — the one floating surface allowed a soft shadow for elevation */}
      <div
        aria-hidden={!isOpen}
        className={`fixed bottom-24 right-4 z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-hairline bg-white shadow-lg transition-all duration-[250ms] ease-out sm:right-6 ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline bg-paper px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-coal">
              <span className="text-xs font-bold text-paper">M</span>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-ink">MFTEL</h3>
              <p className="text-xs text-ink-3">{t.replyTime}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label={isKR ? "채팅 닫기" : "Close chat"}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-3 transition-colors duration-150 hover:bg-well hover:text-ink"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === "info" ? (
          /* Info Form */
          <form onSubmit={handleStartChat} className="space-y-4 bg-white p-5">
            <p className={`break-keep text-sm text-ink-2 ${bodyLeading}`}>
              {t.leaveMessage}<br/>{t.getBack}
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-3">
                  {t.nameLabel} <span className="text-ink-4">{t.nameOptional}</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="h-11 w-full rounded-lg border border-hairline bg-white px-3.5 text-sm text-ink transition-colors duration-150 placeholder:text-ink-4 focus:border-ink-4 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-3">
                  {t.emailLabel} <span className="text-ink-4">{t.emailOptional}</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="h-11 w-full rounded-lg border border-hairline bg-white px-3.5 text-sm text-ink transition-colors duration-150 placeholder:text-ink-4 focus:border-ink-4 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="h-11 w-full rounded-lg bg-ember-700 text-sm font-medium text-white transition-colors duration-150 hover:bg-ember-800"
            >
              {t.startChat}
            </button>
            <p className="text-xs text-ink-4">
              {t.anonymousNote}
            </p>
          </form>
        ) : (
          /* Chat Area */
          <>
            <div className="h-96 space-y-3 overflow-y-auto bg-paper p-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] ${msg.isUser ? "" : "flex gap-2"}`}>
                    {!msg.isUser && (
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-coal">
                        <span className="text-xs font-bold text-paper">M</span>
                      </div>
                    )}
                    <div>
                      <div
                        className={`rounded-lg px-3.5 py-2.5 ${
                          msg.isUser
                            ? "bg-coal text-paper"
                            : "border border-hairline bg-white text-ink-2"
                        }`}
                      >
                        <p className={`break-keep text-sm ${bodyLeading}`}>{msg.text}</p>
                      </div>
                      <Meta className={`mt-1 block text-[11px] ${msg.isUser ? "text-right" : "text-left"}`}>
                        {msg.time}
                      </Meta>
                    </div>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-coal">
                      <span className="text-xs font-bold text-paper">M</span>
                    </div>
                    <div className="rounded-lg border border-hairline bg-white px-3.5 py-3">
                      <div className="flex space-x-1.5">
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-4" style={{ animationDelay: "0ms" }}></div>
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-4" style={{ animationDelay: "150ms" }}></div>
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-4" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-hairline bg-white p-3">
              <div className="flex items-end gap-2">
                <button
                  onClick={handleReset}
                  title={t.newConversation}
                  aria-label={t.newConversation}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors duration-150 hover:bg-well hover:text-ink"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div className="relative flex-1">
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
                    className="h-11 w-full resize-none rounded-lg border border-hairline bg-well px-3.5 py-3 text-sm text-ink transition-colors duration-150 placeholder:text-ink-4 focus:border-ink-4 focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || isSending}
                  aria-label={isKR ? "보내기" : "Send"}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-ember-700 text-white transition-colors duration-150 hover:bg-ember-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating launcher */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? (isKR ? "채팅 닫기" : "Close chat") : (isKR ? "채팅 열기" : "Open chat")}
        aria-expanded={isOpen}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-hairline-2 bg-coal text-paper transition-colors duration-150 hover:bg-coal-raised sm:right-6"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
