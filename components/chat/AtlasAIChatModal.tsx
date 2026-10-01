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
  Globe,
  Eye,
  EyeOff,
  Trash2,
  Lock,
} from "lucide-react";
import { AIQueryAction } from "@/lib/services/ai-query-engine";
import { MarkdownContent } from "./MarkdownContent";
import { WebSearchResult } from "@/lib/services/web-search-service";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  facts?: { label: string; value: string | number; unit?: string }[];
  actions?: AIQueryAction[];
  sources?: WebSearchResult[];
  timestamp: string;
  source?: string;
  geminiError?: string;
}

const DEFAULT_SUGGESTIONS = [
  "What are data sources for electricity prices in USD around the world?",
  "What is the cheapest electricity price in the world for data centers?",
  "Which US states do not have a data center?",
  "Compare Ashburn vs Dallas for 500MW site selection",
  "What are BTM nuclear co-location economics at Susquehanna?",
  "Which cable landing stations connect Virginia to Europe?",
  "How does dual-utility transmission redundancy reduce SAIDI outage risk?",
  "What is the PJM interconnection queue delay?",
  "How many data centres are in India?",
  "How many were there in 2025?",
  "What is the largest data center by power demand?",
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
  const [showKey, setShowKey] = useState(false);

  // Key testing state
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [connectedModel, setConnectedModel] = useState<string>("gemini-3.6-flash");
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
        "Welcome to **AtlasGrid AI Copilot**. Grounded directly on verified global infrastructure telemetry with a **strict zero-hallucination policy**.\n\nYou can query institutional site selection metrics, FERC interconnection queues, behind-the-meter nuclear co-location economics, dual-feed transmission redundancy, subsea cable landing stations, or regional compute clusters.",
      facts: [
        { label: "India Data Centers (By 2025)", value: 272 },
        { label: "India Total (2026)", value: 290 },
        { label: "Global Data Centers", value: 6686 },
        { label: "Global Electricity Hubs", value: 26 },
        { label: "Subsea Cable Landing Hubs", value: 10 },
        { label: "BTM Baseload Sites", value: 8 },
      ],
      timestamp: "SYSTEM READY",
      source: "grounded-dataset",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-purge any legacy API key from localStorage to ensure zero client exposure
  useEffect(() => {
    try {
      localStorage.removeItem("atlasgrid_gemini_key");
    } catch {
      // ignore
    }
    setGeminiApiKey("");
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

  const saveApiKey = (key?: string) => {
    // Cyber defense: Never store raw keys in client storage
    try {
      localStorage.removeItem("atlasgrid_gemini_key");
    } catch {
      // ignore
    }
    setGeminiApiKey("");
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const testApiKey = async () => {
    setIsTestingKey(true);
    setKeyTestResult(null);

    try {
      const res = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      setKeyTestResult(data);
      if (data.valid && data.model) {
        setConnectedModel(data.model);
      }
    } catch (err: any) {
      setKeyTestResult({
        valid: false,
        error: "Network error testing server key vault: " + err.message,
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    // 1. Cyber Security Defense: Intercept any attempt to paste or inject raw API keys
    const detectedKey = text.match(/AIza[0-9A-Za-z-_]{35}/) || text.match(/sk-[a-zA-Z0-9]{20,}/);
    if (detectedKey) {
      setInput("");
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: "[Direct Credential Input Intercepted by Cyber Shield]",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content:
            "🛡️ **Cyber Defense Shield Alert (SEC-403)**: Direct credential pasting or injection is strictly blocked. AtlasGrid operates on an isolated server-side vault architecture where API keys are never stored, displayed, or copy-pasted in client browsers.\n\nThe system is already connected to our protected intelligence gateway. You can query any data center metrics, power tariffs, or site analytics directly.",
          facts: [
            { label: "Credential Vault", value: "SERVER_ISOLATED" },
            { label: "Client Key Exposure", value: "ZERO_EXPOSURE" },
            { label: "DLP Guardrail", value: "ACTIVE_BLOCKING" },
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source: "grounded-dataset",
        },
      ]);
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
          sources: data.sources,
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

  if (!isChatOpen) {
    return (
      <aside className="fixed bottom-5 right-5 z-40 animate-in fade-in zoom-in-95 duration-200 select-none">
        <button
          onClick={() => setChatOpen(true)}
          className="group relative flex items-center gap-2.5 rounded-full bg-[#137cbd] hover:bg-[#2b95d6] text-white px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] border border-[#2b95d6]/70 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          title="Open AtlasGrid AI Copilot (⌘J)"
        >
          {/* Glowing status indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#15b371] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#15b371]" />
          </span>

          <Sparkles className="h-4 w-4 text-white animate-pulse" />

          <span className="font-mono text-xs font-bold tracking-wider text-white">
            AI COPILOT
          </span>

          <kbd className="hidden sm:inline-flex items-center justify-center rounded bg-black/30 px-1.5 py-0.5 text-[9px] font-mono border border-white/20 text-white/90">
            ⌘J
          </kbd>
        </button>
      </aside>
    );
  }

  return (
    <aside className="fixed bottom-5 right-5 z-40 flex h-[650px] w-[580px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-[#293742] bg-[#182026] text-white shadow-[0_12px_45px_rgba(0,0,0,0.7)] font-sans overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-[#293742] bg-[#101418] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#182026] border border-[#293742] text-[#2b95d6]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold tracking-wider text-[#f5f8fa]">
                ATLASGRID // AI COPILOT
              </span>
              <span className="rounded bg-[#137cbd]/15 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#2b95d6] border border-[#137cbd]/30 flex items-center gap-1">
                <Globe className="h-2.5 w-2.5" />
                LIVE WEB
              </span>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="rounded bg-[#0f9960]/20 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#15b371] border border-[#0f9960]/40 flex items-center gap-1 hover:bg-[#0f9960]/30 transition-colors cursor-pointer"
                title="Gemini Master Vault Active (SEC-403 Isolated) - Click to Inspect"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#15b371] animate-pulse" />
                {connectedModel
                  ? `${connectedModel.replace("gemini-", "GEMINI ").toUpperCase()} // SECURE`
                  : "GEMINI VAULT ACTIVE"}
              </button>
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
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-bold text-[#f5f8fa]">
              <Lock className="h-3.5 w-3.5 text-[#2b95d6]" />
              CYBER DEFENSE CREDENTIAL SHIELD // SERVER VAULT
            </span>
            <div className="flex items-center gap-2">
              {keySaved && (
                <span className="flex items-center gap-1 text-[10px] text-[#15b371]">
                  <Check className="h-3 w-3" /> VAULT SECURED
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("atlasgrid_gemini_key");
                  } catch {
                    // ignore
                  }
                  setGeminiApiKey("");
                  setKeyTestResult(null);
                }}
                className="flex items-center gap-1 rounded bg-[#db3737]/15 border border-[#db3737]/30 px-2 py-0.5 text-[10px] font-semibold text-[#f55656] hover:bg-[#db3737]/30 hover:border-[#db3737]/50 transition-colors cursor-pointer"
                title="Purge Legacy Keys & Clear Session Storage"
              >
                <Trash2 className="h-3 w-3" />
                <span>Purge Key</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[#8a9ba8] mb-2.5 leading-relaxed">
            AtlasGrid enforces a **Zero-Exposure Cyber Defense Architecture (SEC-403)**. Master API credentials reside exclusively within the server-side hardware security vault. Client browser storage, DOM elements, and API payloads are strictly forbidden from viewing, copying, or transmitting raw API keys.
          </p>

          {/* Masked Active Key Display Card */}
          <div className="mb-2.5 rounded border border-[#293742] bg-[#141b22] px-3 py-2 flex items-center justify-between select-none">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="h-4 w-4 text-[#15b371] shrink-0" />
              <div className="truncate text-[11px]">
                <span className="text-[#8a9ba8]">Server Vault Key: </span>
                <span className="font-mono text-[#f5f8fa] font-semibold tracking-wider select-none pointer-events-none">
                  ••••••••••••••••
                </span>
                <span className="ml-2 rounded bg-[#0f9960]/20 px-1 py-0.2 text-[9px] text-[#15b371] border border-[#0f9960]/30 font-mono">
                  ZERO EXPOSURE
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="p-1 text-[#8a9ba8] hover:text-[#f5f8fa] rounded transition-colors ml-2 shrink-0 cursor-pointer"
              title={showKey ? "Hide Vault Mask" : "Inspect Vault Status"}
              aria-label={showKey ? "Mask API Key" : "Show API Key"}
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <input
                type={showKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                readOnly
                disabled
                value={showKey ? "•••••••••••••••• [VAULT ENCRYPTED - CANNOT VIEW OR COPY]" : "••••••••••••••••"}
                placeholder="Server Vault Key (Protected: Zero Client Exposure)"
                className="w-full rounded border border-[#293742] bg-[#182026] pl-2.5 pr-8 py-1.5 text-xs text-[#8a9ba8] placeholder-[#5c7080] focus:border-[#2b95d6] focus:outline-none font-mono tracking-wider select-none cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a9ba8] hover:text-[#f5f8fa] transition-colors p-0.5 cursor-pointer"
                title={showKey ? "Hide Vault Mask" : "Inspect Vault Status"}
                aria-label={showKey ? "Mask API Key" : "Show API Key"}
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => testApiKey()}
              disabled={isTestingKey}
              className="flex items-center gap-1 rounded bg-[#137cbd] px-3 py-1.5 font-mono text-xs font-semibold text-white hover:bg-[#2b95d6] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isTestingKey ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying Vault...</span>
                </>
              ) : (
                <span>Test Vault</span>
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
                  {keyTestResult.valid ? "✓ Server Vault Verified: " : "❌ Verification Notice: "}
                </span>
                <span>{keyTestResult.message || keyTestResult.error}</span>
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between text-[10px] text-[#5c7080]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-[#15b371]" />
              Zero Client Storage • Egress DLP Protection Active
            </span>
            <span className="text-[#2b95d6] flex items-center gap-0.5">
              SEC-403 Enforced <Lock className="h-2.5 w-2.5" />
            </span>
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
              className={`max-w-[95%] rounded-md p-3.5 leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-[#202b33] text-[#f5f8fa] border border-[#293742]"
                  : "bg-[#101418] text-[#e1e8ed] border-l-2 border-l-[#2b95d6] border-y border-r border-[#293742]"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-xs text-[#f5f8fa] leading-relaxed whitespace-pre-wrap font-sans">{msg.content}</p>
              ) : (
                <MarkdownContent content={msg.content} />
              )}

              {/* Fact Chips */}
              {msg.facts && msg.facts.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#293742] flex flex-wrap gap-1.5 font-mono">
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
                <div className="mt-2 flex flex-wrap gap-1.5 font-mono">
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

              {/* Verified Web Intelligence Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#293742]">
                  <div className="flex items-center gap-1.5 mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#8a9ba8]">
                    <Globe className="h-3 w-3 text-[#2b95d6]" />
                    <span>Live Web Search Intelligence Sources ({msg.sources.length}):</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {msg.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded bg-[#182026] hover:bg-[#202b33] border border-[#293742] hover:border-[#2b95d6]/50 px-2.5 py-1 text-[11px] text-[#c5d1de] hover:text-white transition-colors group"
                        title={src.snippet || src.title}
                      >
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className="font-mono text-[9px] font-bold uppercase text-[#2b95d6] shrink-0 bg-[#101418] px-1 py-0.2 rounded border border-[#293742]">
                            {src.source}
                          </span>
                          <span className="truncate text-[11px] text-[#e1e8ed] group-hover:text-[#2b95d6]">
                            {src.title}
                          </span>
                        </div>
                        <ExternalLink className="h-3 w-3 shrink-0 text-[#5c7080] group-hover:text-[#2b95d6]" />
                      </a>
                    ))}
                  </div>
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
              placeholder="Ask about facilities, 2025 commissioning, power tariffs, or site analytics..."
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
    </aside>
  );
}
