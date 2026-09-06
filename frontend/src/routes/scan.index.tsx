import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle2, LogOut, RefreshCw, XCircle } from "lucide-react";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { scanStats, scanTicketFn, hostLogin } from "@/lib/nawo.functions";
import { formatDate } from "@/lib/nawo";
import { HOST_CODE_KEY } from "./scan.login";

export const Route = createFileRoute("/scan/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Scanner les billets — NAWO" },
      {
        name: "description",
        content:
          "Scannez les QR codes des billets NAWO et validez les entrées journée par journée.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Scanner les billets — NAWO" },
      { property: "og:description", content: "Contrôle d'accès en temps réel, par journée." },
    ],
  }),
  component: ScanPage,
});

type SessionInfo = {
  id: string;
  name: string;
  session_date: string;
  start_time: string | null;
};

type ScanResult = {
  ok: boolean;
  message: string;
  holder?: string | undefined;
  ticketType?: string | undefined;
  sessionName?: string | undefined;
};

function ScanPage() {
  const navigate = useNavigate();
  const doScan = scanTicketFn;
  const loadStats = scanStats;
  const loadHost = hostLogin;

  const [code, setCode] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState("");
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ scanned: number; eventName: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const sessionRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    const stored = localStorage.getItem(HOST_CODE_KEY);
    if (!stored) {
      navigate({ to: "/scan/login" });
      return;
    }
    setCode(stored);
  }, [navigate]);

  const refreshStats = async (hostCode: string) => {
    try {
      const data = await loadStats({
        data: { code: hostCode, ...(sessionRef.current ? { sessionId: sessionRef.current } : {}) },
      });
      setStats({ scanned: data.count, eventName: data.host?.eventName ?? "" });
    } catch {
      /* ignore */
    }
  };

  const handleToken = async (hostCode: string, token: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const res = await doScan({
        data: {
          code: hostCode,
          qrToken: token,
          ...(sessionRef.current ? { sessionId: sessionRef.current } : {}),
        },
      });
      const details =
        "holder" in res
          ? {
              holder: res.holder,
              ticketType: res.ticketType ?? undefined,
              sessionName: res.sessionName ?? undefined,
            }
          : {};
      const mapped: ScanResult =
        res.result === "valid"
          ? { ok: true, message: "Billet valide", ...details }
          : res.result === "already_used"
            ? { ok: false, message: "Déjà scanné pour cette journée", ...details }
            : res.result === "not_allowed"
              ? { ok: false, message: "Billet non valable pour cette journée", ...details }
              : {
                  ok: false,
                  message: res.result === "unauthorized" ? "Accès refusé" : "Billet invalide",
                };
      setResult(mapped);
      if (navigator.vibrate) navigator.vibrate(mapped.ok ? 80 : [60, 60, 60]);
      await refreshStats(hostCode);
    } catch {
      setResult({ ok: false, message: "Billet invalide." });
    } finally {
      setTimeout(() => {
        busyRef.current = false;
      }, 1500);
    }
  };

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    void (async () => {
      try {
        const host = await loadHost({ data: { code } });
        if (cancelled || !host) return;
        setSessions(host.sessions as SessionInfo[]);
        const today = new Date().toISOString().slice(0, 10);
        const initial =
          host.sessions.find((s: any) => s.session_date === today)?.id ??
          host.sessions[0]?.id ??
          null;
        sessionRef.current = initial;
        setSessionId(initial);
      } finally {
        if (!cancelled) void refreshStats(code);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (!code) return;
    const scanner = new Html5Qrcode("nawo-scanner");
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => void handleToken(code, decoded),
        () => {},
      )
      .catch(() => {
        setResult({ ok: false, message: "Caméra indisponible. Utilisez la saisie manuelle." });
      });

    return () => {
      scanner.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function signOut() {
    localStorage.removeItem(HOST_CODE_KEY);
    navigate({ to: "/scan/login" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-foreground text-background">
      <header className="flex items-center justify-between px-5 py-4">
        <NawoLogo inverted />
        <Button variant="ghost" size="sm" onClick={signOut} className="text-background">
          <LogOut className="size-4" />
          Quitter
        </Button>
      </header>

      <div className="mx-auto w-full max-w-md px-5 pb-10">
        {sessions.length > 1 ? (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  sessionRef.current = s.id;
                  setSessionId(s.id);
                  if (code) void refreshStats(code);
                }}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                  sessionId === s.id
                    ? "bg-background text-foreground"
                    : "bg-background/10 text-background/80"
                }`}
              >
                {s.name} · {formatDate(s.session_date, s.start_time)}
              </button>
            ))}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl bg-black">
          <div id="nawo-scanner" className="w-full" />
        </div>

        {stats ? (
          <p className="mt-4 text-center text-sm opacity-80">
            {stats.eventName} · {stats.scanned} entrée{stats.scanned > 1 ? "s" : ""} validée
            {stats.scanned > 1 ? "s" : ""}
            {sessions.length > 1 ? " sur cette journée" : ""}
          </p>
        ) : null}

        {result ? (
          <div
            className={`mt-4 rounded-2xl p-5 text-center ${
              result.ok
                ? "bg-success text-background"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            <span className="mx-auto mb-2 grid size-10 place-items-center">
              {result.ok ? <CheckCircle2 className="size-9" /> : <XCircle className="size-9" />}
            </span>
            <p className="text-lg font-extrabold">{result.message}</p>
            {result.holder ? <p className="mt-1 text-sm">{result.holder}</p> : null}
            {result.ticketType ? <p className="text-sm opacity-90">{result.ticketType}</p> : null}
            {result.sessionName ? <p className="text-xs opacity-80">{result.sessionName}</p> : null}
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setResult(null)}>
              <RefreshCw className="size-4" />
              Scanner le suivant
            </Button>
          </div>
        ) : null}

        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (code && manual.trim()) {
              void handleToken(code, manual.trim());
              setManual("");
            }
          }}
        >
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Saisie manuelle du code billet"
            className="bg-background text-foreground"
          />
          <Button type="submit" variant="secondary">
            Valider
          </Button>
        </form>
      </div>
    </div>
  );
}
