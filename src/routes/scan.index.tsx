import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle2, LogOut, RefreshCw, XCircle } from "lucide-react";
import { NawoLogo } from "@/components/nawo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { scanStats, scanTicketFn } from "@/lib/nawo.functions";
import { HOST_CODE_KEY } from "./scan.login";

export const Route = createFileRoute("/scan/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Scanner les billets — NAWO" },
      {
        name: "description",
        content: "Scannez les QR codes des billets NAWO et validez les entrées en temps réel.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Scanner les billets — NAWO" },
      { property: "og:description", content: "Contrôle d'accès en temps réel." },
    ],
  }),
  component: ScanPage,
});

type ScanResult = {
  ok: boolean;
  message: string;
  holder?: string | undefined;
  ticketType?: string | undefined;
};

function ScanPage() {
  const navigate = useNavigate();
  const doScan = useServerFn(scanTicketFn);
  const loadStats = useServerFn(scanStats);

  const [code, setCode] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState("");
  const [stats, setStats] = useState<{ scanned: number; eventName: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);

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
      const data = await loadStats({ data: { code: hostCode } });
      setStats({ scanned: data.count, eventName: data.host?.eventName ?? "" });
    } catch {
      /* ignore */
    }
  };

  const handleToken = async (hostCode: string, token: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const res = await doScan({ data: { code: hostCode, qrToken: token } });
      const mapped: ScanResult =
        res.result === "valid"
          ? {
              ok: true,
              message: "Billet valide",
              holder: res.holder,
              ticketType: res.ticketType ?? undefined,
            }
          : res.result === "already_used"
            ? {
                ok: false,
                message: "Billet déjà scanné",
                holder: res.holder,
                ticketType: res.ticketType ?? undefined,
              }
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
    void refreshStats(code);
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
        <div className="overflow-hidden rounded-2xl bg-black">
          <div id="nawo-scanner" className="w-full" />
        </div>

        {stats ? (
          <p className="mt-4 text-center text-sm opacity-80">
            {stats.eventName} · {stats.scanned} entrée{stats.scanned > 1 ? "s" : ""} validée
            {stats.scanned > 1 ? "s" : ""}
          </p>
        ) : null}

        {result ? (
          <div
            className={`mt-4 rounded-2xl p-5 text-center ${
              result.ok ? "bg-success text-background" : "bg-destructive text-destructive-foreground"
            }`}
          >
            <span className="mx-auto mb-2 grid size-10 place-items-center">
              {result.ok ? <CheckCircle2 className="size-9" /> : <XCircle className="size-9" />}
            </span>
            <p className="text-lg font-extrabold">{result.message}</p>
            {result.holder ? <p className="mt-1 text-sm">{result.holder}</p> : null}
            {result.ticketType ? <p className="text-sm opacity-90">{result.ticketType}</p> : null}
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setResult(null)}
            >
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
