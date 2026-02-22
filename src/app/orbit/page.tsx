"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import { REGISTRY_ADDRESS, REGISTRY_ABI, BASE_CHAIN } from "@/components/orbit/contract";

// ─── Types ───
type Message = { role: "user" | "orbit"; text: string };
type Tab = "chat" | "train" | "stats";
type Stats = { shards: number; predictions: number; trainSteps: number; rewards: string };

// ─── Helpers ───
function bytesToAscii(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  let result = "";
  for (let i = 0; i < clean.length; i += 2) {
    const code = parseInt(clean.substring(i, i + 2), 16);
    if (code >= 32 && code < 127) result += String.fromCharCode(code);
    else if (code === 0) break;
    else result += " ";
  }
  return result.trim();
}

function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

// ─── Main Component ───
export default function OrbitPage() {
  const [tab, setTab] = useState<Tab>("chat");
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isBase, setIsBase] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "orbit", text: "Hello! I am ORBIT, the first on-chain LLM. Ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [trainInput, setTrainInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [trainResult, setTrainResult] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Wallet ───
  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);

      const bal = await provider.getBalance(accounts[0]);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 8453) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BASE_CHAIN.chainId }],
          });
          setIsBase(true);
        } catch (switchErr: any) {
          if (switchErr.code === 4902) {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [BASE_CHAIN],
            });
            setIsBase(true);
          }
        }
      } else {
        setIsBase(true);
      }
    } catch (err) {
      console.error("Connect error:", err);
    }
  }, []);

  // ─── Chat ───
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
      const questionBytes = textToBytes(userMsg);
      const result = await registry.chat(questionBytes, 100);
      const response = bytesToAscii(result);
      setMessages((prev) => [...prev, { role: "orbit", text: response || "(empty response)" }]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "orbit", text: `Error: ${err.message?.slice(0, 100) || "Unknown error"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  // ─── Train ───
  const trainModel = useCallback(async () => {
    if (!trainInput.trim() || loading || !account) return;
    setLoading(true);
    setTrainResult(null);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
      const textBytes = textToBytes(trainInput.trim());

      const tx = await registry.trainOnText(textBytes, 50);
      setTrainResult(`⏳ Tx submitted: ${tx.hash}`);
      const receipt = await tx.wait();

      // Get rewards
      const rewards = await registry.getRewards(account);
      const rewardEth = ethers.formatEther(rewards);

      setTrainResult(
        `✅ Training complete!\n` +
        `Tx: ${tx.hash}\n` +
        `Gas used: ${receipt.gasUsed.toString()}\n` +
        `Your ORBIT rewards: ${rewardEth}`
      );
      setTrainInput("");
    } catch (err: any) {
      setTrainResult(`❌ Error: ${err.message?.slice(0, 200) || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [trainInput, loading, account]);

  // ─── Stats ───
  const loadStats = useCallback(async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
      const [nShards, predictions, trainSteps] = await registry.getStats();
      const shardCount = await registry.getShardCount();
      let rewards = "0";
      if (account) {
        const r = await registry.getRewards(account);
        rewards = ethers.formatEther(r);
      }
      setStats({
        shards: Number(shardCount),
        predictions: Number(predictions),
        trainSteps: Number(trainSteps),
        rewards,
      });
    } catch (err) {
      console.error("Stats error:", err);
    }
  }, [account]);

  useEffect(() => {
    if (tab === "stats") loadStats();
  }, [tab, loadStats]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Styles ───
  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1628 100%)",
      color: "#e0e0ff",
      fontFamily: "'Inter', -apple-system, sans-serif",
    } as React.CSSProperties,
    header: {
      padding: "24px",
      textAlign: "center" as const,
      borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
    },
    title: {
      fontSize: "2.5rem",
      fontWeight: 800,
      background: "linear-gradient(90deg, #8b5cf6, #06b6d4, #8b5cf6)",
      backgroundSize: "200% auto",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animation: "gradient 3s ease infinite",
    } as React.CSSProperties,
    subtitle: { color: "#8888aa", fontSize: "0.9rem", marginTop: "4px" },
    tabs: {
      display: "flex",
      justifyContent: "center",
      gap: "8px",
      padding: "16px",
    } as React.CSSProperties,
    tab: (active: boolean) =>
      ({
        padding: "10px 24px",
        borderRadius: "12px",
        border: "none",
        cursor: "pointer",
        fontSize: "0.95rem",
        fontWeight: 600,
        background: active
          ? "linear-gradient(135deg, #8b5cf6, #06b6d4)"
          : "rgba(255,255,255,0.05)",
        color: active ? "#fff" : "#8888aa",
        transition: "all 0.2s",
      }) as React.CSSProperties,
    wallet: {
      position: "absolute" as const,
      top: "20px",
      right: "24px",
    },
    walletBtn: {
      padding: "8px 16px",
      borderRadius: "10px",
      border: "1px solid rgba(139, 92, 246, 0.4)",
      background: "rgba(139, 92, 246, 0.15)",
      color: "#c4b5fd",
      cursor: "pointer",
      fontSize: "0.85rem",
      fontWeight: 500,
    } as React.CSSProperties,
    content: {
      maxWidth: "720px",
      margin: "0 auto",
      padding: "0 20px 100px",
    } as React.CSSProperties,
    chatBox: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "12px",
      minHeight: "400px",
      maxHeight: "500px",
      overflowY: "auto" as const,
      padding: "16px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(139, 92, 246, 0.15)",
    },
    msg: (isUser: boolean) =>
      ({
        padding: "12px 16px",
        borderRadius: "12px",
        maxWidth: "85%",
        alignSelf: isUser ? "flex-end" : "flex-start",
        background: isUser
          ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
          : "rgba(6, 182, 212, 0.1)",
        border: isUser ? "none" : "1px solid rgba(6, 182, 212, 0.2)",
        color: "#e0e0ff",
        fontSize: "0.95rem",
        lineHeight: 1.5,
        wordBreak: "break-word" as const,
      }) as React.CSSProperties,
    inputRow: {
      display: "flex",
      gap: "8px",
      marginTop: "16px",
    } as React.CSSProperties,
    input: {
      flex: 1,
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid rgba(139, 92, 246, 0.3)",
      background: "rgba(255,255,255,0.05)",
      color: "#e0e0ff",
      fontSize: "0.95rem",
      outline: "none",
    } as React.CSSProperties,
    sendBtn: {
      padding: "12px 24px",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
      color: "#fff",
      fontWeight: 600,
      cursor: "pointer",
      fontSize: "0.95rem",
    } as React.CSSProperties,
    statCard: {
      padding: "24px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(139, 92, 246, 0.15)",
      textAlign: "center" as const,
    },
    statValue: {
      fontSize: "2rem",
      fontWeight: 700,
      background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    } as React.CSSProperties,
    statLabel: { color: "#8888aa", fontSize: "0.85rem", marginTop: "4px" },
    textarea: {
      width: "100%",
      minHeight: "120px",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid rgba(139, 92, 246, 0.3)",
      background: "rgba(255,255,255,0.05)",
      color: "#e0e0ff",
      fontSize: "0.95rem",
      outline: "none",
      resize: "vertical" as const,
      fontFamily: "inherit",
    } as React.CSSProperties,
    footer: {
      textAlign: "center" as const,
      padding: "20px",
      color: "#555",
      fontSize: "0.8rem",
      borderTop: "1px solid rgba(139, 92, 246, 0.1)",
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes gradient { 0%,100% { background-position: 0% center; } 50% { background-position: 100% center; } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ position: "relative" }}>
        <div style={styles.header}>
          <div style={styles.title}>ORBIT</div>
          <div style={styles.subtitle}>The First On-Chain LLM — Live on Base</div>
        </div>
        <div style={styles.wallet}>
          {account ? (
            <div style={styles.walletBtn}>
              {isBase ? "🟢" : "🔴"} {account.slice(0, 6)}...{account.slice(-4)} • {balance} ETH
            </div>
          ) : (
            <button style={styles.walletBtn} onClick={connectWallet}>
              🦊 Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(["chat", "train", "stats"] as Tab[]).map((t) => (
          <button key={t} style={styles.tab(tab === t)} onClick={() => setTab(t)}>
            {t === "chat" ? "💬 Chat" : t === "train" ? "🧠 Train" : "📊 Stats"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* CHAT TAB */}
        {tab === "chat" && (
          <>
            <div style={styles.chatBox}>
              {messages.map((m, i) => (
                <div key={i} style={styles.msg(m.role === "user")}>
                  <strong>{m.role === "user" ? "You" : "🌐 ORBIT"}</strong>
                  <div style={{ marginTop: "4px" }}>{m.text}</div>
                </div>
              ))}
              {loading && (
                <div style={styles.msg(false)}>
                  <strong>🌐 ORBIT</strong>
                  <div style={{ marginTop: "4px", animation: "pulse 1.5s infinite" }}>
                    Thinking on-chain...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={styles.inputRow}>
              <input
                style={styles.input}
                placeholder="Ask ORBIT anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={loading}
              />
              <button style={styles.sendBtn} onClick={sendMessage} disabled={loading}>
                {loading ? "..." : "Send"}
              </button>
            </div>
            <div style={{ marginTop: "8px", color: "#666", fontSize: "0.8rem", textAlign: "center" }}>
              💡 Chat is free — it reads from the blockchain without gas
            </div>
          </>
        )}

        {/* TRAIN TAB */}
        {tab === "train" && (
          <>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={{ color: "#c4b5fd", marginBottom: "8px" }}>🧠 Train ORBIT</h2>
              <p style={{ color: "#8888aa", fontSize: "0.9rem" }}>
                Submit text to teach ORBIT new patterns. Each training transaction costs gas
                but earns you ORBIT rewards.
              </p>
            </div>

            {!account ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "#8888aa", marginBottom: "16px" }}>
                  Connect your wallet to train the model
                </p>
                <button style={styles.sendBtn} onClick={connectWallet}>
                  🦊 Connect MetaMask
                </button>
              </div>
            ) : !isBase ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#f59e0b" }}>
                ⚠️ Please switch to Base network
              </div>
            ) : (
              <>
                <textarea
                  style={styles.textarea}
                  placeholder="Enter training text... (e.g., 'The capital of France is Paris.')"
                  value={trainInput}
                  onChange={(e) => setTrainInput(e.target.value)}
                  disabled={loading}
                />
                <div style={{ marginTop: "12px", display: "flex", gap: "12px", alignItems: "center" }}>
                  <button
                    style={{ ...styles.sendBtn, opacity: loading || !trainInput.trim() ? 0.5 : 1 }}
                    onClick={trainModel}
                    disabled={loading || !trainInput.trim()}
                  >
                    {loading ? "⏳ Training..." : "🚀 Train Model"}
                  </button>
                  <span style={{ color: "#666", fontSize: "0.8rem" }}>
                    Costs gas • Earns ORBIT tokens
                  </span>
                </div>

                {trainResult && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      borderRadius: "12px",
                      background: "rgba(6, 182, 212, 0.1)",
                      border: "1px solid rgba(6, 182, 212, 0.2)",
                      whiteSpace: "pre-wrap",
                      fontSize: "0.85rem",
                      wordBreak: "break-all",
                    }}
                  >
                    {trainResult}
                    {trainResult.includes("Tx:") && (
                      <div style={{ marginTop: "8px" }}>
                        <a
                          href={`https://basescan.org/tx/${trainResult.match(/Tx: (0x[a-f0-9]+)/)?.[1]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#06b6d4" }}
                        >
                          View on BaseScan →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* STATS TAB */}
        {tab === "stats" && (
          <>
            <h2 style={{ color: "#c4b5fd", marginBottom: "16px", textAlign: "center" }}>
              📊 Model Statistics
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats?.shards ?? "..."}</div>
                <div style={styles.statLabel}>Smart Contracts</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>19.1M</div>
                <div style={styles.statLabel}>Parameters</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats?.trainSteps?.toLocaleString() ?? "..."}</div>
                <div style={styles.statLabel}>Training Steps</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats?.predictions?.toLocaleString() ?? "..."}</div>
                <div style={styles.statLabel}>Predictions Made</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats?.rewards ?? "..."}</div>
                <div style={styles.statLabel}>Your ORBIT Rewards</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>Base</div>
                <div style={styles.statLabel}>Blockchain Network</div>
              </div>
            </div>

            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(139, 92, 246, 0.15)",
                fontSize: "0.85rem",
                color: "#8888aa",
              }}
            >
              <strong style={{ color: "#c4b5fd" }}>Architecture:</strong> Sparse Modular Network (SMN)
              <br />
              96 NgramShards + 1 LookupShard = 97 specialized contracts
              <br />
              Each shard is an expert in specific character patterns
              <br />
              <br />
              <strong style={{ color: "#c4b5fd" }}>Registry:</strong>{" "}
              <a
                href={`https://basescan.org/address/${REGISTRY_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#06b6d4" }}
              >
                {REGISTRY_ADDRESS}
              </a>
            </div>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button style={styles.walletBtn} onClick={loadStats}>
                🔄 Refresh Stats
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        ORBIT — Deployed on Base • 97 Smart Contracts • 19M Parameters • Fully On-Chain
      </div>
    </div>
  );
}
