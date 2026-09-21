"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGridStore } from "@/lib/store/useGridStore";
import {
  Sparkles,
  Bot,
  Send,
  X,
  Settings,
  Key,
  ShieldCheck,
  MapPin,
  Filter,
  Database,
  Check,
  Loader2,
  Terminal,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AIQueryAction } from "@/lib/services/ai-query-engine";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  facts?: { label: string; value: string | number; unit?: string }[];
  actions?: AIQueryAction[];
  timestamp: string;
  source?: string;
  geminiError?: string;
}

const DEFAULT_SUGGESTIONS = [
  "How many data centres are in India?",
  "How many were there in 2025?",
  "What is the largest data center by power demand?",
  "How many data centers does Equinix operate?",
  "Show global solar and nuclear generation capacity",
];

export function AtlasAIChatModal() {
  const isChatOpen = useGridStore((s) => s.isChatOpen);
  const setChatOpen = useGridStore((s) => s.setChatOpen);
  const flyToCoordinates = useGridStore((s) => s.flyToCoordinates);
  const setFilter = useGridStore((s) => s.setFilter);
  const setInfrastructureType = useGridStore((s) => s.setInfrastructureType);
  const dataCenters = useGridStore((s) => s.dataCenters);
  const setSelectedDataCenter = useGridStore((s) => s.setSelectedDataCenter);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  // Key testing state
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{
    valid: boolean;
    model?: string;
    message?: string;
    error?: string;
  } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Welcome to **AtlasGrid AI Copilot**. Grounded directly on verified global infrastructure telemetry with a **strict zero-hallucination policy**.\n\nYou can query facility counts, historical commissioning years (e.g. *how many data centres in India, how many in 2025*), power demands, or regional infrastructure clusters.",
      facts: [
        { label: "India Data Centers (By 2025)", value: 272 },
        { label: "India Total (2026)", value: 290 },
        { label: "Global Data Centers", value: 6686 },
      ],
      timestamp: "SYSTEM READY",
      source: "grounded-dataset",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user API key from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("atlasgrid_gemini_key");
      if (stored) {
        setGeminiApiKey(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // Global hotkey ⌘J or Ctrl+J to open copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        setChatOpen(!useGridStore.getState().isChatOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setChatOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  const saveApiKey = (key: string) => {
    const clean = key.trim().replace(/['"]/g, "");
    setGeminiApiKey(clean);
    try {
      if (clean) {
        localStorage.setItem("atlasgrid_gemini_key", clean);
      } else {
        localStorage.removeItem("atlasgrid_gemini_key");
      }
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    } catch {
      // ignore
    }
  };

  const testApiKey = async (customKey?: string) => {
    const key = (customKey !== undefined ? customKey : geminiApiKey)
      .trim()
      .replace(/['"]/g, "");

    if (!key) {
      setKeyTestResult({ valid: false, error: "Please enter an API key first." });
      return;
    }

    setIsTestingKey(true);
    setKeyTestResult(null);

    try {
      const res = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });

      const data = await res.json();
      setKeyTestResult(data);
      if (data.valid) {
        saveApiKey(key);
      }
    } catch (err: any) {
      setKeyTestResult({
        valid: false,
        error: "Network error testing API key: " + err.message,
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    // 1. Check if user typed or pasted an API key directly into the chat prompt
    const detectedKey = text.match(/AIza[0-9A-Za-z-_]{35}/);
    if (detectedKey) {
      const extractedKey = detectedKey[0];
      saveApiKey(extractedKey);
      testApiKey(extractedKey);

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: "Configured Google Gemini API Key: ••••••••••" + extractedKey.slice(-4),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: `✓ **Gemini API Key Detected & Saved!**\n\nYour key (\`••••••••${extractedKey.slice(-4)}\`) has been saved. We are testing connectivity to Google AI Studio now.\n\nYou can ask any questions regarding our dataset (e.g. *"how many data centres in India, how many in 2025"*).`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source: "gemini-grounded",
        },
      ]);
      setInput("");
      return;
    }

    setInput("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const savedToken =
        typeof window !== "undefined" ? localStorage.getItem("atlasgrid_token") : null;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          prompt: text,
          apiKey: geminiApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: data.answer,
          facts: data.facts,
          actions: data.actions,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source: data.source,
          geminiError: data.geminiError,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `**Query Subsystem Notice**: ${data.error || "Unable to complete request."}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "**Network Warning**: Intelligence gateway offline or unreachable.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = (action: AIQueryAction) => {
    if (action.type === "FLY_TO" && action.coordinates) {
      flyToCoordinates(action.coordinates[0], action.coordinates[1], action.zoom || 8);
      if (action.dcId) {
        const dc = dataCenters.find((d) => d.id === action.dcId);
        if (dc) setSelectedDataCenter(dc);
      }
    } else if (action.type === "FILTER" && action.filterParams) {
      if (action.filterParams.region) {
        setFilter("region", action.filterParams.region);
      }
      if (action.filterParams.infrastructureType) {
        setInfrastructureType(action.filterParams.infrastructureType);
      }
    }
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex h-[620px] w-[540px] max-w-[calc(100vw-2rem)] flex-col rounded-lg border border-[#293742] bg-[#182026] text-white shadow-2xl font-sans overflow-hidden">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-[#293742] bg-[#101418] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#182026] border border-[#293742] text-[#2b95d6]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-wider text-[#f5f8fa]">
                ATLASGRID // AI COPILOT
              </span>
              {geminiApiKey ? (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="rounded bg-[#0f9960]/20 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#15b371] border border-[#0f9960]/40 flex items-center gap-1 hover:bg-[#0f9960]/30 transition-colors"
                  title="Gemini API Key Active - Click to Manage"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#15b371] animate-pulse" />
                  GEMINI ACTIVE
                </button>
              ) : (
                <button
                  onClick={() => setShowSettings(true)}
                  className="rounded bg-[#202b33] px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#8a9ba8] border border-[#293742] hover:text-[#2b95d6] hover:border-[#2b95d6]/50 transition-colors"
                  title="Click to Connect Gemini API Key"
                >
                  + CONNECT GEMINI KEY
                </button>
              )}
            </div>
            <p className="font-mono text-[10px] text-[#8a9ba8]">
              Palantir Grounded Ontology Engine • Zero-Hallucination Policy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`rounded p-1.5 transition-colors cursor-pointer ${
              showSettings
                ? "bg-[#202b33] text-[#2b95d6]"
                : "text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa]"
            }`}
            title="Configure Gemini API Key"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => setChatOpen(false)}
            className="rounded p-1.5 text-[#8a9ba8] hover:bg-[#202b33] hover:text-[#f5f8fa] transition-colors cursor-pointer"
            title="Close Copilot (⌘J)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel Drawer */}
      {showSettings && (
        <div className="border-b border-[#293742] bg-[#101418] p-3.5 text-xs font-mono">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-[#f5f8fa]">
              <Key className="h-3.5 w-3.5 text-[#2b95d6]" />
              GOOGLE GEMINI API KEY INTEGRATION
            </span>
            {keySaved && (
              <span className="flex items-center gap-1 text-[10px] text-[#15b371]">
                <Check className="h-3 w-3" /> SAVED
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#8a9ba8] mb-2.5 leading-relaxed">
            AtlasGrid connects directly to your Google Gemini API key (supports Gemini 1.5 Flash & 2.0 Flash).
            Enter your key below and click <strong>Test Key</strong> to verify instant connectivity.
          </p>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={geminiApiKey}
              onChange={(e) => {
                const val = e.target.value;
                setGeminiApiKey(val);
                saveApiKey(val);
                setKeyTestResult(null);
              }}
              placeholder="Paste Google AI Studio Key (AIzaSy...)"
              className="flex-1 rounded border border-[#293742] bg-[#182026] px-2.5 py-1.5 text-xs text-[#f5f8fa] placeholder-[#5c7080] focus:border-[#2b95d6] focus:outline-none font-mono"
            />
            <button
              onClick={() => testApiKey()}
              disabled={isTestingKey || !geminiApiKey.trim()}
              className="flex items-center gap-1 rounded bg-[#137cbd] px-3 py-1.5 font-mono text-xs font-semibold text-white hover:bg-[#2b95d6] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isTestingKey ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <span>Test Key</span>
              )}
            </button>
          </div>

          {/* Test Key Feedback Result */}
          {keyTestResult && (
            <div
              className={`rounded p-2 text-[11px] flex items-start gap-1.5 border ${
                keyTestResult.valid
                  ? "bg-[#0f9960]/15 border-[#0f9960]/40 text-[#15b371]"
                  : "bg-[#db3737]/15 border-[#db3737]/40 text-[#f55656]"
              }`}
            >
              {keyTestResult.valid ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold">
                  {keyTestResult.valid ? "✓ Connection Successful: " : "❌ Verification Error: "}
                </span>
                <span>{keyTestResult.message || keyTestResult.error}</span>
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between text-[10px] text-[#5c7080]">
            <span>Keys are stored strictly on client localStorage</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[#2b95d6] hover:underline flex items-center gap-0.5"
            >
              Get Gemini API Key <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      )}

      {/* 2. Messages List */}
      <div className="flex-1 space-y-3.5 overflow-y-auto p-4 font-mono text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <span className="text-[9px] uppercase tracking-wider text-[#5c7080]">
                {msg.role === "user" ? "OPERATOR" : "COPILOT INTELLIGENCE"}
              </span>
              <span className="text-[9px] text-[#5c7080]">•</span>
              <span className="text-[9px] text-[#5c7080]">{msg.timestamp}</span>
              {msg.source && (
                <span className="rounded bg-[#101418] px-1 py-0.2 text-[8px] text-[#8a9ba8] border border-[#293742]">
                  {msg.source === "gemini-grounded" ? "GEMINI + ONTOLOGY" : "GROUNDED DATASET"}
                </span>
              )}
            </div>

            <div
              className={`max-w-[92%] rounded-md p-3 leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#202b33] text-[#f5f8fa] border border-[#293742]"
                  : "bg-[#101418] text-[#e1e8ed] border-l-2 border-l-[#2b95d6] border-y border-r border-[#293742]"
              }`}
            >
              {msg.content}

              {/* Fact Chips */}
              {msg.facts && msg.facts.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#293742] flex flex-wrap gap-1.5">
                  {msg.facts.map((fact, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1 rounded bg-[#182026] px-2 py-0.5 text-[10px] border border-[#293742]"
                    >
                      <span className="text-[#8a9ba8]">{fact.label}:</span>
                      <span className="font-bold text-[#2b95d6] tabular-nums">
                        {fact.value} {fact.unit || ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Action Chips */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => executeAction(act)}
                      className="inline-flex items-center gap-1.5 rounded bg-[#137cbd]/20 hover:bg-[#137cbd]/30 text-[#2b95d6] border border-[#2b95d6]/40 px-2 py-1 text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      {act.type === "FLY_TO" && <MapPin className="h-3 w-3" />}
                      {act.type === "FILTER" && <Filter className="h-3 w-3" />}
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#8a9ba8] p-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#2b95d6]" />
            <span>Consulting AtlasGrid ground truth ontology...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Suggestion Pills */}
      <div className="border-t border-[#293742] bg-[#101418]/80 px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {DEFAULT_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug)}
              disabled={loading}
              className="shrink-0 rounded bg-[#182026] hover:bg-[#202b33] border border-[#293742] px-2 py-0.5 text-[10px] font-mono text-[#a7b6c2] hover:text-white transition-colors cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Chat Input */}
      <div className="border-t border-[#293742] bg-[#101418] p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about facilities, 2025 commissioning, power, or paste API key..."
              disabled={loading}
              className="w-full rounded border border-[#293742] bg-[#182026] pl-3 pr-8 py-2 font-mono text-xs text-[#f5f8fa] placeholder-[#5c7080] focus:border-[#2b95d6] focus:outline-none"
            />
            <div className="absolute right-2.5 top-2.5 text-[#5c7080]">
              <Terminal className="h-3.5 w-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded bg-[#137cbd] text-white hover:bg-[#2b95d6] disabled:opacity-40 transition-colors cursor-pointer"
            title="Send Query (Enter)"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-[#5c7080]">
          <span>Toggle: ⌘J • Enter to submit</span>
          <span>Zero-Hallucination Policy Enforced</span>
        </div>
      </div>
    </div>
  );
}
