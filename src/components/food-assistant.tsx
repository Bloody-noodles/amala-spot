"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Phone, PhoneOff, ShoppingBag, Sparkles, X } from "lucide-react";
import type { MenuItem } from "@/lib/menu";

type Message = { role: "user" | "assistant"; content: string };
type CartLine = { key?: string; itemId: string; quantity: number; options: string[] };
type CallState = "idle" | "connecting" | "listening" | "thinking" | "speaking";
export type VoiceCartAction = {
  type: "add" | "remove" | "set_quantity" | "update_options" | "clear" | "checkout";
  itemId: string; quantity: number; optionIds: string[]; itemName?: string; optionLabels?: string[]; previousOptionIds?: string[];
};
type LiveFunctionCall = { id?: string; name: string; args?: Record<string, unknown> };
type LiveServerMessage = {
  setupComplete?: Record<string, unknown>;
  serverContent?: {
    modelTurn?: { parts?: Array<{ text?: string; inlineData?: { data?: string; mimeType?: string } }> };
    inputTranscription?: { text?: string }; outputTranscription?: { text?: string };
    turnComplete?: boolean; interrupted?: boolean;
  };
  inputTranscription?: { text?: string }; outputTranscription?: { text?: string };
  toolCall?: { functionCalls?: LiveFunctionCall[] }; goAway?: { timeLeft?: string };
};

const LIVE_MODEL = "gemini-3.8-live";
const VOICE_NAME = "Orus";
const callCopy: Record<CallState, string> = {
  idle: "READY WHEN YOU ARE", connecting: "CONNECTING SECURELY…", listening: "I'M LISTENING — GO AHEAD",
  thinking: "LET ME THINK…", speaking: "AMALA AI IS SPEAKING"
};
const tools = [{
  functionDeclarations: [
    { name: "get_basket", description: "Read the customer's actual current basket and total before answering basket questions.", parameters: { type: "OBJECT", properties: {} } },
    { name: "add_to_basket", description: "Add an item only when the customer clearly asks to order or add it. A recommendation is not permission.", parameters: { type: "OBJECT", properties: { item_id: { type: "STRING" }, quantity: { type: "INTEGER" }, option_ids: { type: "ARRAY", items: { type: "STRING" } } }, required: ["item_id", "quantity", "option_ids"] } },
    { name: "remove_from_basket", description: "Remove quantity from an exact existing basket line. option_ids must match.", parameters: { type: "OBJECT", properties: { item_id: { type: "STRING" }, quantity: { type: "INTEGER" }, option_ids: { type: "ARRAY", items: { type: "STRING" } } }, required: ["item_id", "quantity", "option_ids"] } },
    { name: "set_basket_quantity", description: "Set quantity on an exact existing basket line. Zero removes that line.", parameters: { type: "OBJECT", properties: { item_id: { type: "STRING" }, quantity: { type: "INTEGER" }, option_ids: { type: "ARRAY", items: { type: "STRING" } } }, required: ["item_id", "quantity", "option_ids"] } },
    { name: "update_basket_options", description: "Change extras on an exact existing basket line.", parameters: { type: "OBJECT", properties: { item_id: { type: "STRING" }, previous_option_ids: { type: "ARRAY", items: { type: "STRING" } }, option_ids: { type: "ARRAY", items: { type: "STRING" } } }, required: ["item_id", "previous_option_ids", "option_ids"] } },
    { name: "clear_basket", description: "Clear the whole basket only after the customer explicitly confirms when asked.", parameters: { type: "OBJECT", properties: {} } },
    { name: "open_checkout", description: "Open the existing checkout form only when the customer explicitly asks. Never submit an order.", parameters: { type: "OBJECT", properties: {} } }
  ]
}];

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}
function resampleTo16k(input: Float32Array, inputRate: number) {
  if (inputRate === 16000) return input;
  const ratio = inputRate / 16000;
  const output = new Float32Array(Math.max(1, Math.floor(input.length / ratio)));
  for (let i = 0; i < output.length; i++) {
    const pos = i * ratio, left = Math.floor(pos), right = Math.min(left + 1, input.length - 1), frac = pos - left;
    output[i] = input[left] * (1 - frac) + input[right] * frac;
  }
  return output;
}
function encodePcm16(samples: Float32Array) {
  const buffer = new ArrayBuffer(samples.length * 2), view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }
  return toBase64(new Uint8Array(buffer));
}
function makeSystemInstruction(menu: MenuItem[], cart: CartLine[]) {
  const catalogue = menu.map(item => ({
    id: item.id, name: item.name, category: item.category, description: item.description,
    priceNaira: item.priceKobo / 100,
    extras: item.options.map(option => ({ id: option.id, name: option.label, priceNaira: option.priceKobo / 100 }))
  }));
  const basket = cart.map(line => {
    const item = menu.find(entry => entry.id === line.itemId);
    if (!item) return null;
    const extras = item.options.filter(option => line.options.includes(option.id));
    return { itemId: item.id, name: item.name, quantity: line.quantity, extras: extras.map(option => option.label),
      lineTotalNaira: (item.priceKobo + extras.reduce((sum, option) => sum + option.priceKobo, 0)) * line.quantity / 100 };
  }).filter(Boolean);
  const total = basket.reduce((sum, line) => sum + (line?.lineTotalNaira ?? 0), 0);
  return [
    "You are Amala AI, a warm, knowledgeable Nigerian food host: a young Yoruba guy from Nigeria. You are an AI, never claim to be a real employee or to have personal experiences.",
    "Speak clear, natural Nigerian English. Understand Nigerian English, light Pidgin and common Yoruba food names. Use Pidgin or Yoruba only when natural; never force slang, exaggerate an accent or stereotype. Be concise, relaxed, confident and good-humoured.",
    "Help customers discover Nigerian food and build their basket. Discuss food, menu, taste, listed ingredients and ordering. Briefly steer unrelated topics back to food.",
    "Use ONLY the exact catalogue below for item names, descriptions, prices and extras. Never invent dishes, prices, ingredients, stock, allergens, delivery, opening hours or restaurant facts. Prices are illustrative demo prices in naira, not a real restaurant offer.",
    "The actual basket below is the source of truth. Use get_basket before answering basket contents or totals. Add only after a clear request to order/add; recommendations are not permission. For changes use exact item and option IDs from the basket. Never claim success until a tool confirms it. Ask before clearing the whole basket; clear only after explicit confirmation. Open checkout only when explicitly asked; it only opens the form. Never submit orders or claim payment/fulfilment.",
    "For ambiguous dish, quantity or extra, ask one short follow-up. If a tool returns an error, explain it plainly and do not claim success.",
    "CURRENT MENU: " + JSON.stringify(catalogue),
    "CURRENT BASKET: " + JSON.stringify(basket),
    "CURRENT BASKET TOTAL: ₦" + total.toLocaleString("en-NG")
  ].join("\n");
}

export function FoodAssistant({ onCartActions, onOpenCheckout, cart, menu }: {
  onCartActions: (actions: VoiceCartAction[]) => void; onOpenCheckout: () => void; cart: CartLine[]; menu: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "How far? Wetin you dey feel like eating today? Tell me what you're craving and let's find something correct." }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesRef = useRef(messages), cartRef = useRef(cart), menuRef = useRef(menu);
  const socketRef = useRef<WebSocket | null>(null), streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<AudioContext | null>(null), processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlaybackRef = useRef(0), setupReadyRef = useRef(false), callActiveRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { menuRef.current = menu; }, [menu]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const appendMessage = (role: Message["role"], content: string) => {
    const value = content.trim();
    if (!value) return;
    const next = [...messagesRef.current, { role, content: value }].slice(-20);
    messagesRef.current = next; setMessages(next);
  };
  const stopPlayback = () => {
    playbackRef.current.forEach(source => { try { source.stop(); } catch { /* already stopped */ } });
    playbackRef.current.clear(); nextPlaybackRef.current = audioRef.current?.currentTime ?? 0;
  };
  const cleanupCall = () => {
    callActiveRef.current = false; setupReadyRef.current = false; setCallActive(false);
    try { processorRef.current?.disconnect(); } catch { /* no-op */ }
    try { sourceRef.current?.disconnect(); } catch { /* no-op */ }
    processorRef.current = null; sourceRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
    const socket = socketRef.current; socketRef.current = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, "Call ended");
    stopPlayback(); void audioRef.current?.close(); audioRef.current = null; setCallState("idle");
  };
  const sendBasketContext = () => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN && setupReadyRef.current) {
      socket.send(JSON.stringify({ contextUpdate: { systemInstruction: { parts: [{ text: makeSystemInstruction(menuRef.current, cartRef.current) }] } } }));
    }
  };
  const calculateCart = (action: VoiceCartAction) => {
    const current = cartRef.current;
    if (action.type === "clear") return [];
    if (action.type === "checkout") return current;
    const options = [...action.optionIds].sort(), key = action.itemId + ":" + options.join(",");
    const found = current.find(line => line.itemId === action.itemId && [...line.options].sort().join(",") === options.join(","));
    if (action.type === "add") return found
      ? current.map(line => line === found ? { ...line, quantity: Math.min(20, line.quantity + action.quantity) } : line)
      : [...current, { key, itemId: action.itemId, quantity: action.quantity, options }];
    if (action.type === "remove" || action.type === "set_quantity") {
      if (!found) return current;
      const nextQty = action.type === "remove" ? found.quantity - action.quantity : action.quantity;
      return nextQty > 0 ? current.map(line => line === found ? { ...line, quantity: nextQty } : line) : current.filter(line => line !== found);
    }
    if (action.type === "update_options") {
      const oldKey = [...(action.previousOptionIds ?? [])].sort().join(",");
      const previous = current.find(line => line.itemId === action.itemId && [...line.options].sort().join(",") === oldKey);
      if (!previous) return current;
      const conflict = current.find(line => line !== previous && line.itemId === action.itemId && [...line.options].sort().join(",") === options.join(","));
      if (conflict) return current.filter(line => line !== previous).map(line => line === conflict ? { ...line, quantity: Math.min(20, line.quantity + previous.quantity) } : line);
      return current.map(line => line === previous ? { ...line, key, options } : line);
    }
    return current;
  };

  const executeTool = (call: LiveFunctionCall) => {
    const args = call.args ?? {}, currentMenu = menuRef.current, currentCart = cartRef.current;
    const snapshot = () => {
      const lines = cartRef.current.map(line => {
        const item = currentMenu.find(entry => entry.id === line.itemId);
        if (!item) return null;
        const extras = item.options.filter(option => line.options.includes(option.id));
        return { itemId: item.id, name: item.name, quantity: line.quantity, extras: extras.map(option => option.label),
          lineTotalNaira: (item.priceKobo + extras.reduce((sum, option) => sum + option.priceKobo, 0)) * line.quantity / 100 };
      }).filter(Boolean);
      return { lines, totalNaira: lines.reduce((sum, line) => sum + (line?.lineTotalNaira ?? 0), 0) };
    };
    const respond = (result: Record<string, unknown>) => {
      if (call.id && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response: result }] } }));
      }
    };
    const fail = (reason: string) => respond({ ok: false, error: reason, basket: snapshot() });
    const itemId = typeof args.item_id === "string" ? args.item_id : "";
    const item = currentMenu.find(entry => entry.id === itemId);
    const quantity = typeof args.quantity === "number" && Number.isInteger(args.quantity) ? args.quantity : -1;
    const optionIds = Array.isArray(args.option_ids) && args.option_ids.every(value => typeof value === "string") ? args.option_ids as string[] : [];
    const validOptions = (entry: MenuItem, ids: string[]) => ids.length <= 20 && new Set(ids).size === ids.length && ids.every(id => entry.options.some(option => option.id === id));

    if (call.name === "get_basket") { respond({ ok: true, basket: snapshot() }); return; }
    if (call.name === "clear_basket") {
      const latestUser = messagesRef.current.filter(message => message.role === "user").at(-1)?.content.toLowerCase() ?? "";
      const latestAssistant = messagesRef.current.filter(message => message.role === "assistant").at(-1)?.content.toLowerCase() ?? "";
      const confirmed = /(yes|yeah|confirm|go ahead|clear it|empty it)/i.test(latestUser) && /(clear|empty).*(basket|cart)|(basket|cart).*(clear|empty)/i.test(latestAssistant);
      if (!confirmed) { fail("Ask the customer to confirm clearing the entire basket before doing it."); return; }
      const action: VoiceCartAction = { type: "clear", itemId: "", quantity: 0, optionIds: [] };
      onCartActions([action]); cartRef.current = [];
      respond({ ok: true, message: "Basket cleared.", basket: { lines: [], totalNaira: 0 } }); sendBasketContext(); return;
    }
    if (call.name === "open_checkout") {
      const latestUser = messagesRef.current.filter(message => message.role === "user").at(-1)?.content.toLowerCase() ?? "";
      const latestAssistant = messagesRef.current.filter(message => message.role === "assistant").at(-1)?.content.toLowerCase() ?? "";
      const directIntent = /(checkout|check out|proceed|finish.*order|place.*order|ready.*order)/i.test(latestUser);
      const confirmedIntent = /(yes|yeah|okay|ok|go ahead|let's do it|do it|sure)/i.test(latestUser) &&
        /(checkout|check out|proceed|finish.*order|place.*order)/i.test(latestAssistant);
      if (!currentCart.length || (!directIntent && !confirmedIntent)) {
        fail("The customer must explicitly ask to proceed to checkout, and the basket must not be empty."); return;
      }
      respond({ ok: true, message: "Opening the existing checkout form. The customer must review and submit it themselves.", basket: snapshot() });
      cleanupCall(); onOpenCheckout(); return;
    }
    if (!item || (call.name !== "update_basket_options" && (quantity < 0 || quantity > 20)) || !validOptions(item, optionIds)) {
      fail("The menu item, quantity or extras are invalid. Ask the customer to choose from the current menu."); return;
    }
    if (call.name === "add_to_basket") {
      if (quantity < 1) { fail("Quantity must be between 1 and 20."); return; }
      const action: VoiceCartAction = { type: "add", itemId, quantity, optionIds };
      onCartActions([action]); cartRef.current = calculateCart(action);
      respond({ ok: true, message: "Added " + quantity + " × " + item.name + ".", basket: snapshot() }); sendBasketContext(); return;
    }
    if (call.name === "remove_from_basket" || call.name === "set_basket_quantity") {
      const line = currentCart.find(entry => entry.itemId === itemId && [...entry.options].sort().join("|") === [...optionIds].sort().join("|"));
      if (!line) { fail("There is no " + item.name + " line with those exact extras in the basket."); return; }
      if (call.name === "remove_from_basket" && (quantity < 1 || quantity > line.quantity)) { fail("That removal quantity is not available in the basket."); return; }
      const action: VoiceCartAction = { type: call.name === "remove_from_basket" ? "remove" : "set_quantity", itemId, quantity, optionIds };
      onCartActions([action]); cartRef.current = calculateCart(action);
      respond({ ok: true, message: "Basket updated.", basket: snapshot() }); sendBasketContext(); return;
    }
    if (call.name === "update_basket_options") {
      const previousIds = Array.isArray(args.previous_option_ids) && args.previous_option_ids.every(value => typeof value === "string") ? args.previous_option_ids as string[] : [];
      if (!validOptions(item, previousIds)) { fail("The previous extras are invalid."); return; }
      const previous = currentCart.find(entry => entry.itemId === itemId && [...entry.options].sort().join("|") === [...previousIds].sort().join("|"));
      if (!previous) { fail("I could not find that exact basket line to change."); return; }
      const action: VoiceCartAction = { type: "update_options", itemId, quantity: previous.quantity, optionIds, previousOptionIds: previousIds };
      onCartActions([action]); cartRef.current = calculateCart(action);
      respond({ ok: true, message: "Those extras have been updated.", basket: snapshot() }); sendBasketContext(); return;
    }
    fail("That action is not supported.");
  };

  const playAudio = (base64: string) => {
    const context = audioRef.current;
    if (!context) return;
    const binary = atob(base64), samples = new Int16Array(binary.length / 2);
    for (let i = 0; i < samples.length; i++) samples[i] = (binary.charCodeAt(i * 2 + 1) << 8) | binary.charCodeAt(i * 2);
    const buffer = context.createBuffer(1, samples.length, 24000), channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / (samples[i] < 0 ? 32768 : 32767);
    const source = context.createBufferSource(); source.buffer = buffer; source.connect(context.destination);
    const startAt = Math.max(context.currentTime + 0.015, nextPlaybackRef.current);
    source.start(startAt); nextPlaybackRef.current = startAt + buffer.duration;
    playbackRef.current.add(source); source.onended = () => playbackRef.current.delete(source);
    setCallState("speaking");
  };

  const startMicrophone = () => {
    const context = audioRef.current, stream = streamRef.current;
    if (!context || !stream) throw new Error("The microphone is not ready.");
    const source = context.createMediaStreamSource(stream), processor = context.createScriptProcessor(4096, 1, 1), silent = context.createGain();
    silent.gain.value = 0;
    processor.onaudioprocess = event => {
      const socket = socketRef.current;
      if (!callActiveRef.current || !setupReadyRef.current || socket?.readyState !== WebSocket.OPEN) return;
      const pcm = resampleTo16k(event.inputBuffer.getChannelData(0), context.sampleRate);
      socket.send(JSON.stringify({ realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: encodePcm16(pcm) }] } }));
    };
    source.connect(processor); processor.connect(silent); silent.connect(context.destination);
    sourceRef.current = source; processorRef.current = processor;
  };

  const startCall = async () => {
    if (callActiveRef.current) return;
    setError(""); setOpen(true); callActiveRef.current = true; setCallActive(true); setCallState("connecting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser cannot access the microphone. Please use text chat instead.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (!callActiveRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const context = new AudioContext(); audioRef.current = context; await context.resume();
      const response = await fetch("/api/assistant/live-token", { method: "POST", cache: "no-store" });
      const tokenData = await response.json();
      if (!response.ok || typeof tokenData.token !== "string") throw new Error(tokenData.error || "The secure voice session could not be created.");
      if (!callActiveRef.current) return;
      const socket = new WebSocket("wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=" + encodeURIComponent(tokenData.token));
      socketRef.current = socket;
      socket.onopen = () => socket.send(JSON.stringify({
        setup: {
          model: "models/" + LIVE_MODEL,
          generationConfig: {
            responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } } },
            temperature: 0.65, maxOutputTokens: 512
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: { parts: [{ text: makeSystemInstruction(menuRef.current, cartRef.current) }] },
          tools
        }
      }));
      socket.onmessage = event => {
        let message: LiveServerMessage;
        try { message = JSON.parse(event.data as string) as LiveServerMessage; } catch { return; }
        if (message.setupComplete) {
          setupReadyRef.current = true; startMicrophone(); setCallState("thinking");
          socket.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: "Start this call with a short, warm greeting. Ask what the customer feels like eating, then listen." }] }], turnComplete: true } }));
          return;
        }
        const content = message.serverContent;
        if (content?.interrupted) stopPlayback();
        const incoming = content?.inputTranscription?.text ?? message.inputTranscription?.text;
        const outgoing = content?.outputTranscription?.text ?? message.outputTranscription?.text;
        if (incoming) appendMessage("user", incoming);
        if (outgoing) appendMessage("assistant", outgoing);
        for (const part of content?.modelTurn?.parts ?? []) {
          if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("audio/pcm")) playAudio(part.inlineData.data);
          if (part.text) appendMessage("assistant", part.text);
        }
        for (const call of message.toolCall?.functionCalls ?? []) executeTool(call);
        if (content?.turnComplete && playbackRef.current.size === 0) setCallState("listening");
        if (message.goAway) setError("This voice session is nearing its time limit. End the call and reconnect to continue.");
      };
      socket.onerror = () => { if (callActiveRef.current) setError("The live voice connection had a problem. Please reconnect or use text chat."); };
      socket.onclose = event => {
        setupReadyRef.current = false;
        if (callActiveRef.current) { setError(event.reason || "The voice connection ended. You can reconnect or continue by text."); cleanupCall(); }
      };
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start the voice call."); cleanupCall();
    }
  };

  const sendText = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim(); if (!text || busy) return;
    const next = [...messagesRef.current, { role: "user" as const, content: text }].slice(-12);
    messagesRef.current = next; setMessages(next); setInput(""); setBusy(true); setError("");
    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, cart: cartRef.current.map(line => ({ itemId: line.itemId, quantity: line.quantity, options: line.options })) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Amala AI is unavailable.");
      const actions: VoiceCartAction[] = Array.isArray(data.actions) ? data.actions : [];
      for (const action of actions.filter(entry => entry.type !== "checkout")) {
        onCartActions([action]); cartRef.current = calculateCart(action);
      }
      if (actions.some(action => action.type === "checkout")) onOpenCheckout();
      appendMessage("assistant", String(data.reply || "What else can I help you find?"));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Please try again."); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    setVoiceSupported(Boolean(navigator.mediaDevices?.getUserMedia && window.WebSocket && window.AudioContext));
    return () => {
      callActiveRef.current = false;
      setupReadyRef.current = false;
      try { processorRef.current?.disconnect(); } catch { /* no-op */ }
      try { sourceRef.current?.disconnect(); } catch { /* no-op */ }
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) socketRef.current.close();
      playbackRef.current.forEach(source => { try { source.stop(); } catch { /* no-op */ } });
      void audioRef.current?.close();
    };
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  return <>
    <button className="food-assistant-launch" onClick={() => { if (open) { cleanupCall(); setOpen(false); } else setOpen(true); }} aria-label={open ? "Close Amala AI" : "Open Amala AI"}>
      {open ? <X size={20} /> : <Sparkles size={20} />}<span>{open ? "CLOSE" : "CALL AMALA AI"}</span>
    </button>
    {open && <section className="food-assistant-panel" aria-label="Amala Spot AI voice ordering assistant">
      <header className="food-assistant-header">
        <div className="food-assistant-avatar"><Bot size={20} /></div><div><b>AMALA AI</b><small>NIGERIAN FOOD · LIVE VOICE ORDERING</small></div>
        <span className="assistant-live-dot" /><button onClick={() => { cleanupCall(); setOpen(false); }} aria-label="Close assistant"><X size={18} /></button>
      </header>
      <section className={"voice-call-stage " + callState} aria-live="polite" aria-label="Voice call controls">
        <div className="voice-call-orb"><div className="voice-waveform" aria-hidden="true">{Array.from({ length: 19 }, (_, index) => <span key={index} />)}</div></div>
        <div className="voice-call-copy"><b>{callCopy[callState]}</b><small>{callActive ? "LIVE CONVERSATION · MICROPHONE ON" : "TAP START TO TALK WITH AMALA AI"}</small></div>
        {callActive ? <button className="voice-call-button end" onClick={cleanupCall}><PhoneOff size={16} /> END CALL</button>
          : <button className="voice-call-button start" onClick={startCall} disabled={!voiceSupported}><Phone size={16} /> START VOICE CALL</button>}
        {!voiceSupported && <p className="voice-call-support">Live voice is unavailable in this browser. You can still use typed chat.</p>}
      </section>
      <div className="food-assistant-messages">
        {messages.map((message, index) => <div className={"food-assistant-message " + message.role} key={index}><span>{message.role === "assistant" ? "AMALA AI" : "YOU"}</span><p>{message.content}</p></div>)}
        {busy && <div className="food-assistant-message assistant"><span>AMALA AI</span><p className="assistant-typing">Putting that together…</p></div>}
        <div ref={bottomRef} />
      </div>
      {error && <p className="food-assistant-error" role="alert">{error}</p>}
      <div className="food-assistant-tools"><span><ShoppingBag size={14} /> {cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"} IN BASKET</span><small>{callActive ? callCopy[callState] : "VOICE OR TEXT"}</small></div>
      <form className="food-assistant-compose" onSubmit={sendText}>
        <input value={input} onChange={event => setInput(event.target.value)} placeholder="Type what you're craving…" aria-label="Message Amala AI" maxLength={1200} />
        <button disabled={!input.trim() || busy} aria-label="Send message"><ArrowUp size={18} /></button>
      </form>
      <small className="food-assistant-disclaimer">Sample menu and prices · no payment or real restaurant fulfilment</small>
    </section>}
  </>;
}
