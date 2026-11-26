"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Phone, PhoneOff, Plus, Type, X } from "lucide-react";
import { formatNaira, type MenuItem } from "@/lib/menu";

type Message = { role: "user" | "assistant"; content: string };
type Suggestion = { itemId: string; quantity: number; item: MenuItem };
type CallStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error";
type TranscriptLine = { role: "you" | "assistant"; text: string };
type LiveFunctionCall = { id?: string; name?: string; args?: Record<string, unknown> };
type AudioCallWindow = Window & { webkitAudioContext?: typeof AudioContext };
type SocketMessage = {
  setupComplete?: unknown;
  error?: { message?: string };
  toolCall?: { functionCalls?: LiveFunctionCall[] };
  serverContent?: {
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    modelTurn?: { parts?: { inlineData?: { data?: string } }[] };
    interrupted?: boolean;
    toolCall?: { functionCalls?: LiveFunctionCall[] };
  };
};

const LIVE_MODEL = "models/gemini-3.1-flash-live-preview";
const LIVE_SOCKET = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=";

function resample(samples: Float32Array, fromRate: number, toRate: number) {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const output = new Float32Array(Math.round(samples.length / ratio));
  for (let index = 0; index < output.length; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, samples.length - 1);
    const weight = position - left;
    output[index] = samples[left] * (1 - weight) + samples[right] * weight;
  }
  return output;
}

function encodePcm(samples: Float32Array) {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function FoodAssistant({
  onAddItem,
  cart,
  menu,
}: {
  onAddItem: (itemId: string, quantity: number, openBasket?: boolean) => boolean;
  cart: { itemId: string; quantity: number; options: string[] }[];
  menu: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I'm your Amala Spot food guide. Tell me what you're craving, and we'll find something good." }
  ]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const composeRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const playbackRef = useRef(new Set<AudioBufferSourceNode>());
  const nextPlaybackRef = useRef(0);
  const attemptRef = useRef(0);
  const closedByUserRef = useRef(false);
  const connectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopCall = useCallback(() => {
    attemptRef.current += 1;
    closedByUserRef.current = true;
    if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    analyserRef.current = null;
    setVoiceLevel(0);
    if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
    connectionTimerRef.current = null;
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, "Call ended");
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    playbackRef.current.forEach(source => { try { source.stop(); } catch { /* playback may already have ended */ } });
    playbackRef.current.clear();
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    const inputContext = inputContextRef.current;
    const outputContext = outputContextRef.current;
    inputContextRef.current = null;
    outputContextRef.current = null;
    if (inputContext && inputContext.state !== "closed") void inputContext.close();
    if (outputContext && outputContext.state !== "closed") void outputContext.close();
    setCallStatus("idle");
  }, []);

  useEffect(() => () => {
    closedByUserRef.current = true;
    if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
    if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
    socketRef.current?.close();
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    playbackRef.current.forEach(source => { try { source.stop(); } catch { /* playback may already have ended */ } });
    playbackRef.current.clear();
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (inputContextRef.current && inputContextRef.current.state !== "closed") void inputContextRef.current.close();
    if (outputContextRef.current && outputContextRef.current.state !== "closed") void outputContextRef.current.close();
  }, []);

  useEffect(() => {
    if (open && mode === "text") composeRef.current?.focus();
    if (open) {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          stopCall();
          setOpen(false);
          launcherRef.current?.focus();
        }
        if (event.key !== "Tab" || !panelRef.current) return;
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [open, mode, stopCall]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy, suggestions]);

  const setMenuSnapshot = async () => {
    const response = await fetch("/api/menu", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data.items)) window.dispatchEvent(new CustomEvent("amala:menu-snapshot", { detail: data.items as MenuItem[] }));
  };

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
        catch { /* Preserve a valid reply if the menu refresh is briefly unavailable. */ }
      }
      setMessages(current => [...current, { role: "assistant", content: answer }]);
      setSuggestions(nextSuggestions);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const startCall = async () => {
    if (callStatus === "connecting" || callStatus === "listening" || callStatus === "thinking" || callStatus === "speaking") return;
    setError("");
    setTranscript([]);
    setCallStatus("connecting");
    closedByUserRef.current = false;
    const attempt = ++attemptRef.current;
    const isCurrentAttempt = () => attemptRef.current === attempt && !closedByUserRef.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone access is unavailable in this browser. Try a current version of Chrome or Edge.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (!isCurrentAttempt()) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;

      const tokenResponse = await fetch("/api/assistant/token", { method: "POST", cache: "no-store" });
      const tokenData = await tokenResponse.json() as { token?: string; error?: string };
      if (!isCurrentAttempt()) return;
      if (!tokenResponse.ok || !tokenData.token) throw new Error(tokenData.error || "The voice assistant is not configured yet.");

      const AudioContextConstructor = window.AudioContext || (window as AudioCallWindow).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error("This browser cannot start an audio call. Try a recent version of Chrome or Edge.");
      const inputContext = new AudioContextConstructor({ sampleRate: 16000 });
      const outputContext = new AudioContextConstructor({ sampleRate: 24000 });
      inputContextRef.current = inputContext;
      outputContextRef.current = outputContext;
      await Promise.all([inputContext.resume(), outputContext.resume()]);
      if (!isCurrentAttempt()) { await Promise.all([inputContext.close(), outputContext.close()]); return; }

      const socket = new WebSocket(LIVE_SOCKET + encodeURIComponent(tokenData.token));
      socketRef.current = socket;
      connectionTimerRef.current = setTimeout(() => {
        if (!isCurrentAttempt() || socket.readyState === WebSocket.OPEN) return;
        setError("The voice service took too long to connect. Check your connection and try again.");
        stopCall();
        setCallStatus("error");
      }, 20000);

      socket.onopen = () => {
        if (!isCurrentAttempt()) { socket.close(1000, "Call no longer active"); return; }
        if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
        connectionTimerRef.current = null;
        const menuSummary = menu.map(item => `- ${item.id} | ${item.name} | ${formatNaira(item.priceKobo)} | ${item.description}`).join("\n");
        const basketSummary = cart.length ? cart.map(line => {
          const item = menu.find(entry => entry.id === line.itemId);
          return item ? `${line.quantity} x ${item.name}` : null;
        }).filter(Boolean).join(", ") : "empty";
        socket.send(JSON.stringify({
          setup: {
            model: LIVE_MODEL,
            generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: [{ functionDeclarations: [{
              name: "add_menu_items_to_basket",
              description: "Add one or more exact menu items to the visitor's demo basket only after they clearly agree to add those items. This does not place an order or take payment.",
              parameters: {
                type: "OBJECT",
                properties: {
                  visitorConfirmed: { type: "BOOLEAN", description: "True only after the visitor clearly confirms adding these exact items to the basket." },
                  items: { type: "ARRAY", items: { type: "OBJECT", properties: { itemId: { type: "STRING" }, quantity: { type: "INTEGER" } }, required: ["itemId", "quantity"] } }
                },
                required: ["visitorConfirmed", "items"]
              }
            }] }],
            systemInstruction: { parts: [{ text: `You are Amala Spot's warm, concise food concierge on a live voice call. Speak naturally, ask one clear question at a time, and remember what the visitor has already said. Use only this current sample menu and its prices; do not invent ingredients, allergens, availability, delivery promises, or restaurant details.\n\nCURRENT MENU\n${menuSummary}\n\nCURRENT DEMO BASKET\n${basketSummary}\n\nHelp visitors choose a dish. Suggest at most two relevant choices at a time. If they ask about ingredients or allergens and the menu does not say, be clear that you cannot verify. When they choose, confirm the item and quantity in a natural way. Ask permission before adding anything. Call add_menu_items_to_basket only after a clear yes to the exact items and quantities; use the exact itemId from the menu list and set visitorConfirmed true only then. Never add an item based on an assumption. This site is a portfolio demo: basket additions are simulated, no real restaurant receives the request, and no payment is taken. Explain that users can review their sample basket and checkout on the site. Keep each spoken reply brief, conversational, and easy to follow. Allow the visitor to interrupt.` }] }
          }
        }));
      };

      socket.onmessage = async event => {
        if (!isCurrentAttempt()) return;
        try {
          const raw = event.data instanceof Blob ? await event.data.text() : event.data instanceof ArrayBuffer ? new TextDecoder().decode(event.data) : typeof event.data === "string" ? event.data : "";
          const message = JSON.parse(raw) as SocketMessage;
          if (message.error?.message) throw new Error(message.error.message);

          if (message.setupComplete) {
            const source = inputContext.createMediaStreamSource(stream);
            const processor = inputContext.createScriptProcessor(4096, 1, 1);
            const analyser = inputContext.createAnalyser();
            analyser.fftSize = 256;
            sourceRef.current = source;
            processorRef.current = processor;
            analyserRef.current = analyser;
            processor.onaudioprocess = audioEvent => {
              if (socket.readyState !== WebSocket.OPEN) return;
              const samples = resample(audioEvent.inputBuffer.getChannelData(0), inputContext.sampleRate, 16000);
              socket.send(JSON.stringify({ realtimeInput: { audio: { data: encodePcm(samples), mimeType: "audio/pcm;rate=16000" } } }));
            };
            source.connect(analyser);
            analyser.connect(processor);
            const silentGain = inputContext.createGain();
            silentGain.gain.value = 0;
            processor.connect(silentGain);
            silentGain.connect(inputContext.destination);
            const levels = new Uint8Array(analyser.fftSize);
            const animate = () => {
              if (!isCurrentAttempt() || !analyserRef.current) return;
              analyser.getByteTimeDomainData(levels);
              let energy = 0;
              for (const sample of levels) { const value = (sample - 128) / 128; energy += value * value; }
              setVoiceLevel(Math.min(1, Math.sqrt(energy / levels.length) * 4.5));
              animationRef.current = window.requestAnimationFrame(animate);
            };
            animationRef.current = window.requestAnimationFrame(animate);
            setCallStatus("listening");
          }

          const calls = message.toolCall?.functionCalls ?? message.serverContent?.toolCall?.functionCalls ?? [];
          if (calls.length) {
            const functionResponses = calls.map(call => {
              if (call.name !== "add_menu_items_to_basket") return { id: call.id, name: call.name, response: { ok: false, message: "Unknown basket action." } };
              const args = call.args ?? {};
              const requested = args.items;
              if (args.visitorConfirmed !== true || !Array.isArray(requested) || requested.length < 1 || requested.length > 8) {
                return { id: call.id, name: call.name, response: { ok: false, message: "Wait for the visitor to clearly confirm the exact basket items and validate their quantities." } };
              }
              const validated: { item: MenuItem; quantity: number }[] = [];
              for (const rawItem of requested) {
                if (!rawItem || typeof rawItem !== "object") return { id: call.id, name: call.name, response: { ok: false, message: "The basket request was not valid." } };
                const candidate = rawItem as { itemId?: unknown; quantity?: unknown };
                const item = typeof candidate.itemId === "string" ? menu.find(entry => entry.id === candidate.itemId) : undefined;
                if (!item || typeof candidate.quantity !== "number" || !Number.isInteger(candidate.quantity) || candidate.quantity < 1 || candidate.quantity > 10) {
                  return { id: call.id, name: call.name, response: { ok: false, message: "Use an available exact menu item and a quantity from one to ten." } };
                }
                validated.push({ item, quantity: candidate.quantity });
              }
              if (validated.reduce((sum, entry) => sum + entry.quantity, 0) > 20) return { id: call.id, name: call.name, response: { ok: false, message: "Keep the total basket addition to twenty items or fewer." } };
              const added = validated.every(({ item, quantity }) => onAddItem(item.id, quantity, false));
              if (!added) return { id: call.id, name: call.name, response: { ok: false, message: "The basket could not add every item. Ask the visitor to check the menu and try again." } };
              const summary = validated.map(({ item, quantity }) => `${quantity} x ${item.name}`).join(", ");
              setTranscript(current => [...current, { role: "assistant" as const, text: `Added to your demo basket: ${summary}.` }].slice(-12));
              return { id: call.id, name: call.name, response: { ok: true, simulated: true, items: validated.map(({ item, quantity }) => ({ itemId: item.id, name: item.name, quantity, unitPrice: formatNaira(item.priceKobo) })), message: "Items added to the sample basket. No order has been sent." } };
            });
            if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ toolResponse: { functionResponses } }));
          }

          const content = message.serverContent;
          if (content?.inputTranscription?.text?.trim()) {
            setTranscript(current => [...current, { role: "you" as const, text: content.inputTranscription!.text!.trim() }].slice(-12));
            setCallStatus("thinking");
          }
          if (content?.outputTranscription?.text?.trim()) {
            setTranscript(current => [...current, { role: "assistant" as const, text: content.outputTranscription!.text!.trim() }].slice(-12));
            setCallStatus("speaking");
          }
          if (content?.interrupted) {
            playbackRef.current.forEach(source => { try { source.stop(); } catch { /* already ended */ } });
            playbackRef.current.clear();
            nextPlaybackRef.current = outputContext.currentTime;
            if (isCurrentAttempt()) setCallStatus("listening");
          }
          for (const part of content?.modelTurn?.parts ?? []) {
            const encoded = part.inlineData?.data;
            if (!encoded) continue;
            const binary = atob(encoded);
            const pcm = new Int16Array(binary.length / 2);
            for (let index = 0; index < pcm.length; index += 1) pcm[index] = (binary.charCodeAt(index * 2) & 0xff) | (binary.charCodeAt(index * 2 + 1) << 8);
            const audioContext = outputContext;
            const buffer = audioContext.createBuffer(1, pcm.length, 24000);
            const channel = buffer.getChannelData(0);
            for (let index = 0; index < pcm.length; index += 1) channel[index] = pcm[index] / 32768;
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            playbackRef.current.add(source);
            const startAt = Math.max(audioContext.currentTime + 0.02, nextPlaybackRef.current);
            source.start(startAt);
            source.onended = () => {
              playbackRef.current.delete(source);
              if (isCurrentAttempt() && playbackRef.current.size === 0) setCallStatus("listening");
            };
            nextPlaybackRef.current = startAt + buffer.duration;
            setCallStatus("speaking");
          }
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "The voice connection encountered a problem.");
          stopCall();
          setCallStatus("error");
        }
      };

      socket.onerror = () => {
        if (!isCurrentAttempt()) return;
        setError("We couldn't connect to the voice service. Please try again.");
        stopCall();
        setCallStatus("error");
      };
      socket.onclose = () => {
        if (!isCurrentAttempt()) return;
        stopCall();
        setError("The voice connection ended. Your microphone has been released. You can try again.");
        setCallStatus("error");
      };
    } catch (reason) {
      if (!isCurrentAttempt()) return;
      setError(reason instanceof Error ? reason.message : "Something went wrong starting the call.");
      stopCall();
      setCallStatus("error");
    }
  };

  const suggestionsToShow = suggestions.filter(entry => entry.item && entry.item.id === entry.itemId);
  const statusLabel = callStatus === "connecting" ? "Connecting to your food guide…" : callStatus === "listening" ? "Listening · your turn" : callStatus === "thinking" ? "Thinking of something good…" : callStatus === "speaking" ? "Amala AI is speaking" : callStatus === "error" ? "Call unavailable" : "Ready when you are";
  const activeCall = callStatus === "connecting" || callStatus === "listening" || callStatus === "thinking" || callStatus === "speaking";

  return <>
    <button ref={launcherRef} className="food-assistant-launch" onClick={() => { if (open) stopCall(); setOpen(value => !value); }} aria-label={open ? "Close food assistant" : "Talk to Amala AI"} aria-haspopup="dialog" aria-expanded={open} aria-controls="food-assistant-panel">
      {open ? <X size={20}/> : <Phone size={18}/>}<span className="assistant-launch-label">{open ? "CLOSE" : "TALK TO AMALA"}</span><span className="assistant-launch-short">AI</span>
    </button>
    {open && <section ref={panelRef} id="food-assistant-panel" className={`food-assistant-panel${mode === "voice" ? " is-voice-mode" : ""}`} role="dialog" aria-modal="false" aria-labelledby="food-assistant-title">
      <header className="food-assistant-header"><div className="food-assistant-avatar"><Bot size={20}/></div><div><b id="food-assistant-title">AMALA AI</b><small>{mode === "voice" ? "YOUR LIVE FOOD CONCIERGE" : "YOUR FOOD-FINDING SIDEKICK"}</small></div><span className={`assistant-live-dot${activeCall ? " is-active" : ""}`}/><button onClick={() => { stopCall(); setOpen(false); launcherRef.current?.focus(); }} aria-label="Close assistant"><X size={18}/></button></header>
      {mode === "voice" ? <div className="assistant-call-view">
        <div className="assistant-call-copy"><span className="app-kicker">THE AMALA TABLE</span><h2>A little chat<br/><em>over good food.</em></h2><p>Tell me what you&apos;re in the mood for. I&apos;ll help you pick, and add it to your demo basket when you&apos;re ready.</p></div>
        <div className={`assistant-call-orb status-${callStatus}`} style={{ "--voice-level": voiceLevel } as React.CSSProperties} aria-hidden="true"><span><Bot size={31}/></span><i/><b/></div>
        <p className="assistant-call-status" aria-live="polite">{statusLabel}</p>
        {error && <p className="food-assistant-error" role="alert">{error}</p>}
        <div className="assistant-call-transcript" aria-live="polite">{transcript.length ? transcript.map((line, index) => <p key={`${index}-${line.role}`} className={`is-${line.role}`}><b>{line.role === "you" ? "YOU" : "AMALA"}</b>{line.text}</p>) : <p className="assistant-call-hint">Your conversation will appear here.</p>}</div>
        {activeCall ? <button className="assistant-call-action is-end" type="button" onClick={stopCall}><PhoneOff size={18}/> END CALL</button> : <button className="assistant-call-action" type="button" onClick={() => void startCall()}><Phone size={18}/>{callStatus === "error" ? "TRY AGAIN" : "START A VOICE CALL"}</button>}
        <button className="assistant-mode-switch" type="button" onClick={() => { stopCall(); setError(""); setMode("text"); }}><Type size={15}/> Prefer typing? Open text chat</button>
        <small className="assistant-call-disclaimer">Portfolio demo · Basket additions are simulated · No order or payment is sent</small>
      </div> : <>
        <div className="food-assistant-messages" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.map((message,index)=><div className={`food-assistant-message ${message.role}`} key={index}><span>{message.role === "assistant" ? "AMALA AI" : "YOU"}</span><p>{message.content}</p></div>)}
          {busy && <div className="food-assistant-message assistant"><span>AMALA AI</span><p className="assistant-typing">Finding the good stuff…</p></div>}
          {suggestionsToShow.length > 0 && <div className="assistant-suggestions"><span>MENU PICKS · TAP TO ADD</span>{suggestionsToShow.map(({item,quantity})=><article key={item.id}><div><b>{item.name}</b><small>{quantity} × {formatNaira(item.priceKobo)}</small></div><button aria-label={`Add ${item.name} to basket`} onClick={() => { if (!onAddItem(item.id, quantity)) { setError("That menu item is no longer available. Please choose another item from the menu."); return; } setError(""); setMessages(current => [...current, { role: "assistant", content: `Added ${quantity} × ${item.name} to your basket. Open the basket to review your total and continue to checkout.` }]); setSuggestions(current => current.filter(entry => entry.itemId !== item.id)); }}><Plus size={14}/> ADD TO BASKET</button></article>)}</div>}
          <div ref={bottomRef}/>
        </div>
        {error && <p className="food-assistant-error" role="alert">{error}</p>}
        <button className="assistant-mode-switch text-mode-switch" type="button" onClick={() => { setError(""); setMode("voice"); }}><Phone size={15}/> Switch to a live voice call</button>
        <form className="food-assistant-compose" onSubmit={send}><input ref={composeRef} value={input} onChange={event => setInput(event.target.value)} placeholder="I'm craving something spicy…" aria-label="Message Amala AI" maxLength={1200}/><button disabled={!input.trim() || busy} aria-label="Send message"><ArrowUp size={18}/></button></form>
      </>}
    </section>}
  </>;
}
