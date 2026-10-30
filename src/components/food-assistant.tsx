"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Mic, MicOff, Plus, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { menuItems, formatNaira } from "@/lib/menu";

type Message = { role: "user" | "assistant"; content: string };
type Suggestion = { itemId: string; quantity: number };
type SpeechRecognitionResultLike = { [index: number]: { transcript: string }; length: number };
type SpeechRecognitionEventLike = { results: SpeechRecognitionResultLike[] };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export function FoodAssistant({ onAddItem }: { onAddItem: (itemId: string, quantity: number) => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I'm your Amala Spot food guide. Tell me what you're craving, and we'll find something good." }
  ]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    setVoiceAvailable(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
    return () => {
      recognition.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy, suggestions]);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError("");
    setSuggestions([]);
    setBusy(true);
    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The assistant is unavailable.");
      const answer = String(data.reply || "What else can I help you find?");
      setMessages(current => [...current, { role: "assistant", content: answer }]);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      if (voiceReplies && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(answer));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const startVoice = () => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;
    recognition.current?.stop();
    const instance = new Recognition();
    recognition.current = instance;
    instance.lang = "en-NG";
    instance.interimResults = false;
    instance.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) setInput(current => current ? current + " " + transcript : transcript);
    };
    instance.onerror = () => setError("Voice input stopped. You can type your message instead.");
    instance.onend = () => setListening(false);
    setListening(true);
    setError("");
    instance.start();
  };

  const suggestionsToShow = suggestions.map(suggestion => ({
    ...suggestion,
    item: menuItems.find(item => item.id === suggestion.itemId)
  })).filter(entry => entry.item);

  return <>
    <button className="food-assistant-launch" onClick={() => setOpen(value => !value)} aria-label={open ? "Close food assistant" : "Open food assistant"}>
      {open ? <X size={20}/> : <Sparkles size={20}/>}<span>{open ? "CLOSE" : "ASK AMALA AI"}</span>
    </button>
    {open && <section className="food-assistant-panel" aria-label="Amala Spot AI food assistant">
      <header className="food-assistant-header"><div className="food-assistant-avatar"><Bot size={20}/></div><div><b>AMALA AI</b><small>YOUR FOOD-FINDING SIDEKICK</small></div><span className="assistant-live-dot"/> <button onClick={() => setOpen(false)} aria-label="Close assistant"><X size={18}/></button></header>
      <div className="food-assistant-messages">
        {messages.map((message,index)=><div className={`food-assistant-message ${message.role}`} key={index}><span>{message.role === "assistant" ? "AMALA AI" : "YOU"}</span><p>{message.content}</p></div>)}
        {busy && <div className="food-assistant-message assistant"><span>AMALA AI</span><p className="assistant-typing">Finding the good stuff…</p></div>}
        {suggestionsToShow.length > 0 && <div className="assistant-suggestions"><span>MENU PICKS · TAP TO ADD</span>{suggestionsToShow.map(({item,quantity})=><article key={item!.id}><div><b>{item!.name}</b><small>{quantity} × {formatNaira(item!.priceKobo)}</small></div><button onClick={() => { onAddItem(item!.id, quantity); setSuggestions(current => current.filter(entry => entry.itemId !== item!.id)); }}><Plus size={14}/> ADD TO BASKET</button></article>)}</div>}
        <div ref={bottomRef}/>
      </div>
      {error && <p className="food-assistant-error" role="alert">{error}</p>}
      <div className="food-assistant-tools">
        <button className={voiceReplies ? "active" : ""} onClick={() => { setVoiceReplies(value => !value); window.speechSynthesis?.cancel(); }} aria-label="Toggle spoken replies">{voiceReplies ? <Volume2 size={15}/> : <VolumeX size={15}/>}<span>VOICE REPLIES</span></button>
        {voiceAvailable && <button className={listening ? "active" : ""} onClick={listening ? () => recognition.current?.stop() : startVoice} aria-label={listening ? "Stop voice input" : "Start voice input"}>{listening ? <MicOff size={15}/> : <Mic size={15}/>}<span>{listening ? "LISTENING" : "SPEAK"}</span></button>}
      </div>
      <form className="food-assistant-compose" onSubmit={send}><input value={input} onChange={event => setInput(event.target.value)} placeholder="I'm craving something spicy…" aria-label="Message Amala AI" maxLength={1200}/><button disabled={!input.trim() || busy} aria-label="Send message"><ArrowUp size={18}/></button></form>
      <small className="food-assistant-disclaimer">AI menu guide · sample menu and prices · no real restaurant fulfilment</small>
    </section>}
  </>;
}
