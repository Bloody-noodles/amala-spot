"use client";

import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUp, Bot, Mic, MicOff, Plus, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { formatNaira, type MenuItem } from "@/lib/menu";

type Message = { role: "user" | "assistant"; content: string };
type Suggestion = { itemId: string; quantity: number; item: MenuItem };
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
const subscribeToVoiceAvailability = () => () => {};
const getVoiceAvailability = () => typeof window !== "undefined" && Boolean((window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition);
const getServerVoiceAvailability = () => false;

export function FoodAssistant({ onAddItem, cart }: { onAddItem: (itemId: string, quantity: number) => boolean; cart: { itemId: string; quantity: number; options: string[] }[] }) {
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
  const voiceRepliesRef = useRef(false);
  const voiceAvailable = useSyncExternalStore(subscribeToVoiceAvailability, getVoiceAvailability, getServerVoiceAvailability);
  const setMenuSnapshot = async () => {
    const response = await fetch("/api/menu", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data.items)) return;
    window.dispatchEvent(new CustomEvent("amala:menu-snapshot", { detail: data.items as MenuItem[] }));
  };
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const composeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      recognition.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy, suggestions]);

  useEffect(() => {
    if (!open) return;
    composeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

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
        body: JSON.stringify({ messages: next.slice(-12), cart })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The assistant is unavailable.");
      const answer = String(data.reply || "What else can I help you find?");
      const nextSuggestions: Suggestion[] = Array.isArray(data.suggestions) ? data.suggestions : [];
      if (nextSuggestions.length) {
        try { await setMenuSnapshot(); }
        catch { /* Keep the valid assistant response; basket insertion checks current menu state. */ }
      }
      setMessages(current => [...current, { role: "assistant", content: answer }]);
      setSuggestions(nextSuggestions);
      if (voiceRepliesRef.current && "speechSynthesis" in window) {
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
    instance.onerror = () => {
      setListening(false);
      setError("Voice input stopped. You can type your message instead.");
    };
    instance.onend = () => setListening(false);
    setListening(true);
    setError("");
    try {
      instance.start();
    } catch {
      setListening(false);
      setError("Microphone access could not start. Check your browser permission or type your message instead.");
    }
  };

  const suggestionsToShow = suggestions.filter(entry => entry.item && entry.item.id === entry.itemId);

  return <>
    <button ref={launcherRef} className="food-assistant-launch" onClick={() => setOpen(value => !value)} aria-label={open ? "Close food assistant" : "Open food assistant"} aria-haspopup="dialog" aria-expanded={open} aria-controls="food-assistant-panel">
      {open ? <X size={20}/> : <Sparkles size={20}/>}<span className="assistant-launch-label">{open ? "CLOSE" : "ASK AMALA AI"}</span><span className="assistant-launch-short">{open ? "CLOSE" : "AI"}</span>
    </button>
    {open && <section id="food-assistant-panel" className="food-assistant-panel" role="dialog" aria-modal="false" aria-labelledby="food-assistant-title">
      <header className="food-assistant-header"><div className="food-assistant-avatar"><Bot size={20}/></div><div><b id="food-assistant-title">AMALA AI</b><small>YOUR FOOD-FINDING SIDEKICK</small></div><span className="assistant-live-dot"/> <button onClick={() => { setOpen(false); launcherRef.current?.focus(); }} aria-label="Close assistant"><X size={18}/></button></header>
      <div className="food-assistant-messages" role="log" aria-live="polite" aria-relevant="additions text">
        {messages.map((message,index)=><div className={`food-assistant-message ${message.role}`} key={index}><span>{message.role === "assistant" ? "AMALA AI" : "YOU"}</span><p>{message.content}</p></div>)}
        {busy && <div className="food-assistant-message assistant"><span>AMALA AI</span><p className="assistant-typing">Finding the good stuff…</p></div>}
        {suggestionsToShow.length > 0 && <div className="assistant-suggestions"><span>MENU PICKS · TAP TO ADD</span>{suggestionsToShow.map(({item,quantity})=><article key={item!.id}><div><b>{item!.name}</b><small>{quantity} × {formatNaira(item!.priceKobo)}</small></div><button aria-label={`Add ${item!.name} to basket`} onClick={() => { if (!onAddItem(item!.id, quantity)) { setError("That menu item is no longer available. Please choose another item from the menu."); return; } setError(""); setMessages(current => [...current, { role: "assistant", content: `Added ${quantity} × ${item!.name} to your basket. Open the basket to review your total and continue to checkout.` }]); setSuggestions(current => current.filter(entry => entry.itemId !== item!.id)); }}><Plus size={14}/> ADD TO BASKET</button></article>)}</div>}
        <div ref={bottomRef}/>
      </div>
      {error && <p className="food-assistant-error" role="alert">{error}</p>}
      <div className="food-assistant-tools">
        <button className={voiceReplies ? "active" : ""} onClick={() => { const enabled = !voiceRepliesRef.current; voiceRepliesRef.current = enabled; setVoiceReplies(enabled); if (!enabled) window.speechSynthesis?.cancel(); }} aria-label="Spoken replies" aria-pressed={voiceReplies}>{voiceReplies ? <Volume2 size={15}/> : <VolumeX size={15}/>}<span>VOICE REPLIES</span></button>
        {voiceAvailable && <button className={listening ? "active" : ""} onClick={listening ? () => recognition.current?.stop() : startVoice} aria-label={listening ? "Stop voice input" : "Start voice input"}>{listening ? <MicOff size={15}/> : <Mic size={15}/>}<span>{listening ? "LISTENING" : "SPEAK"}</span></button>}
      </div>
      <form className="food-assistant-compose" onSubmit={send}><input ref={composeRef} value={input} onChange={event => setInput(event.target.value)} placeholder="I'm craving something spicy…" aria-label="Message Amala AI" maxLength={1200}/><button disabled={!input.trim() || busy} aria-label="Send message"><ArrowUp size={18}/></button></form>
    </section>}
  </>;
}
