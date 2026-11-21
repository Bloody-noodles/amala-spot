"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Phone, PhoneOff, ShoppingBag, Sparkles, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type CartLine = { itemId: string; quantity: number; options: string[] };
type CallState = "idle" | "listening" | "thinking" | "speaking";
export type VoiceCartAction = {
  type: "add" | "remove" | "set_quantity" | "update_options" | "clear" | "checkout";
  itemId: string;
  quantity: number;
  optionIds: string[];
  itemName?: string;
  optionLabels?: string[];
  previousOptionIds?: string[];
};

type SpeechRecognitionResultLike = { [index: number]: { transcript: string }; length: number };
type SpeechRecognitionEventLike = { results: SpeechRecognitionResultLike[] };
type SpeechRecognitionErrorLike = { error?: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

const callCopy: Record<CallState, string> = {
  idle: "READY WHEN YOU ARE",
  listening: "I'M LISTENING — GO AHEAD",
  thinking: "LET ME THINK…",
  speaking: "AMALA AI IS SPEAKING"
};

export function FoodAssistant({
  onCartActions,
  onOpenCheckout,
  cart
}: {
  onCartActions: (actions: VoiceCartAction[]) => void;
  onOpenCheckout: () => void;
  cart: CartLine[];
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Ẹ káàbọ̀! I'm Amala AI. Tell me what you're craving — amala, abula, jollof, something spicy? Let's sort your basket." }
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const callActiveRef = useRef(false);
  const callStateRef = useRef<CallState>("idle");
  const busyRef = useRef(false);
  const messagesRef = useRef(messages);
  const startListeningRef = useRef<(() => void) | null>(null);
  const sendTextRef = useRef<((text: string, spoken: boolean) => Promise<void>) | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const updateCallState = (next: CallState) => {
    callStateRef.current = next;
    setCallState(next);
  };

  const endCall = () => {
    callActiveRef.current = false;
    setCallActive(false);
    recognition.current?.stop();
    recognition.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    updateCallState("idle");
  };

  const startListening = () => {
    if (!callActiveRef.current) return;
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Voice input is not supported in this browser. You can still type to Amala AI.");
      endCall();
      return;
    }
    try {
      recognition.current?.stop();
      const instance = new Recognition();
      recognition.current = instance;
      instance.lang = "en-NG";
      instance.continuous = false;
      instance.interimResults = false;
      instance.onresult = event => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
        if (transcript) void sendTextRef.current?.(transcript, true);
      };
      instance.onerror = event => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError("Microphone permission was blocked. Allow microphone access in your browser settings, or use the text box.");
          endCall();
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          setError("I couldn't hear that clearly. Try again or type your request.");
        }
      };
      instance.onend = () => {
        if (recognition.current !== instance) return;
        recognition.current = null;
        if (callActiveRef.current && !busyRef.current && callStateRef.current === "listening") {
          window.setTimeout(() => {
            if (!recognition.current) startListeningRef.current?.();
          }, 350);
        }
      };
      updateCallState("listening");
      instance.start();
    } catch {
      setError("The microphone couldn't start. Check browser permission and try again.");
      endCall();
    }
  };
  startListeningRef.current = startListening;

  const sendText = async (rawText: string, spoken: boolean) => {
    const text = rawText.trim();
    if (!text || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    if (spoken && callActiveRef.current) updateCallState("thinking");
    const nextMessages = [...messagesRef.current, { role: "user" as const, content: text }].slice(-12);
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setInput("");

    let shouldResumeCall = spoken;
    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          cart: cart.map(line => ({
            itemId: line.itemId,
            quantity: line.quantity,
            options: line.options
          }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Amala AI is unavailable.");
      const answer = String(data.reply || "What else can I help you find?");
      const actions: VoiceCartAction[] = Array.isArray(data.actions) ? data.actions : [];
      const cartActions = actions.filter(action => action.type !== "checkout");
      if (cartActions.length) onCartActions(cartActions);
      if (actions.some(action => action.type === "checkout")) { endCall(); onOpenCheckout(); }

      const updatedMessages = [...messagesRef.current, { role: "assistant" as const, content: answer }].slice(-12);
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);

      if (spoken && callActiveRef.current && "speechSynthesis" in window) {
        updateCallState("speaking");
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(answer);
        utterance.lang = "en-NG";
        utterance.rate = 1.02;
        utterance.onend = () => {
          if (callActiveRef.current) startListeningRef.current?.();
        };
        utterance.onerror = () => {
          if (callActiveRef.current) startListeningRef.current?.();
        };
        window.speechSynthesis.speak(utterance);
        shouldResumeCall = false;
      }
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Please try again.";
      setError(message);
      const updatedMessages = [...messagesRef.current, { role: "assistant" as const, content: "Sorry, I couldn't complete that turn. Your basket hasn't been changed by that failed request." }].slice(-12);
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);
    } finally {
      busyRef.current = false;
      setBusy(false);
      if (shouldResumeCall && callActiveRef.current) {
        window.setTimeout(() => startListeningRef.current?.(), 450);
      }
    }
  };
  sendTextRef.current = sendText;

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    setVoiceAvailable(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
    return () => {
      callActiveRef.current = false;
      recognition.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const startCall = () => {
    if (!voiceAvailable) return;
    setError("");
    callActiveRef.current = true;
    setCallActive(true);
    setOpen(true);
    startListeningRef.current?.();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void sendText(input, callActiveRef.current);
  };

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  return <>
    <button className="food-assistant-launch" onClick={() => {
      if (open) { endCall(); setOpen(false); }
      else setOpen(true);
    }} aria-label={open ? "Close Amala AI" : "Open Amala AI"}>
      {open ? <X size={20}/> : <Sparkles size={20}/>}<span>{open ? "CLOSE" : "CALL AMALA AI"}</span>
    </button>
    {open && <section className="food-assistant-panel" aria-label="Amala Spot AI voice ordering assistant">
      <header className="food-assistant-header">
        <div className="food-assistant-avatar"><Bot size={20}/></div>
        <div><b>AMALA AI</b><small>NIGERIAN FOOD · VOICE ORDERING</small></div>
        <span className="assistant-live-dot"/>
        <button onClick={() => { endCall(); setOpen(false); }} aria-label="Close assistant"><X size={18}/></button>
      </header>

      <section className={`voice-call-stage ${callState}`} aria-live="polite" aria-label="Voice call controls">
        <div className="voice-call-orb">
          <div className="voice-waveform" aria-hidden="true">
            {Array.from({ length: 19 }, (_, index) => <span key={index}/>)}
          </div>
        </div>
        <div className="voice-call-copy"><b>{callCopy[callState]}</b><small>{callActive ? "AMALA AI IS HERE WITH YOU" : "TAP START TO ORDER BY VOICE"}</small></div>
        {callActive
          ? <button className="voice-call-button end" onClick={endCall}><PhoneOff size={16}/> END CALL</button>
          : <button className="voice-call-button start" onClick={startCall} disabled={!voiceAvailable}><Phone size={16}/> START VOICE CALL</button>}
        {!voiceAvailable && <p className="voice-call-support">Voice input is unavailable in this browser. Typed ordering still works below.</p>}
      </section>

      <div className="food-assistant-messages">
        {messages.map((message,index)=><div className={`food-assistant-message ${message.role}`} key={index}>
          <span>{message.role === "assistant" ? "AMALA AI" : "YOU"}</span><p>{message.content}</p>
        </div>)}
        {busy && <div className="food-assistant-message assistant"><span>AMALA AI</span><p className="assistant-typing">Putting that together…</p></div>}
        <div ref={bottomRef}/>
      </div>

      {error && <p className="food-assistant-error" role="alert">{error}</p>}
      <div className="food-assistant-tools">
        <span><ShoppingBag size={14}/> {cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"} IN BASKET</span>
        <small>{callActive ? callCopy[callState] : "VOICE OR TEXT"}</small>
      </div>
      <form className="food-assistant-compose" onSubmit={submit}>
        <input value={input} onChange={event => setInput(event.target.value)} placeholder="Say or type what you're craving…" aria-label="Message Amala AI" maxLength={1200}/>
        <button disabled={!input.trim() || busy} aria-label="Send message"><ArrowUp size={18}/></button>
      </form>
      <small className="food-assistant-disclaimer">Sample menu and prices · no payment or real restaurant fulfilment</small>
    </section>}
  </>;
}

