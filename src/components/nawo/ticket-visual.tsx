import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { formatDate } from "@/lib/nawo";

type Template = {
  image_url: string | null;
  qr_x: number;
  qr_y: number;
  qr_width: number;
  qr_height: number;
  status: string;
} | null;

type TicketVisualProps = {
  qrToken: string;
  ticketNumber: string;
  holder: string;
  eventName: string;
  eventDate?: string;
  eventTime?: string | null;
  location?: string;
  ticketTypeName: string;
  template?: Template;
  fallbackImage?: string | null;
};

export function TicketVisual(props: TicketVisualProps) {
  const { qrToken, template } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [composed, setComposed] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(qrToken, { margin: 1, width: 512, errorCorrectionLevel: "H" }).then(
      setQrDataUrl,
    );
  }, [qrToken]);

  const templateImage = template?.status === "active" ? template.image_url : null;

  useEffect(() => {
    if (!templateImage || !qrDataUrl || !template) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base = new Image();
    base.crossOrigin = "anonymous";
    base.onload = () => {
      canvas.width = base.naturalWidth;
      canvas.height = base.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(base, 0, 0);
      const qr = new Image();
      qr.onload = () => {
        ctx.drawImage(qr, template.qr_x, template.qr_y, template.qr_width, template.qr_height);
        setComposed(true);
      };
      qr.src = qrDataUrl;
    };
    base.src = templateImage;
  }, [templateImage, qrDataUrl, template]);

  if (templateImage) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
        <canvas ref={canvasRef} className="w-full" aria-label="Billet NAWO" />
        {!composed ? (
          <p className="p-3 text-center text-xs text-muted-foreground">Génération du billet…</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="card-surface overflow-hidden">
      <div className="bg-brand px-5 py-4 text-primary-foreground">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-90">NAWO</p>
        <p className="mt-1 text-lg font-extrabold leading-tight">{props.eventName}</p>
      </div>
      {props.fallbackImage ? (
        <img src={props.fallbackImage} alt="" className="max-h-56 w-full object-cover" />
      ) : null}
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="space-y-1 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Titulaire</p>
          <p className="font-bold">{props.holder}</p>
          <p className="text-muted-foreground">
            {props.ticketTypeName}
            {props.eventDate ? ` · ${formatDate(props.eventDate, props.eventTime ?? null)}` : ""}
          </p>
          {props.location ? <p className="text-muted-foreground">{props.location}</p> : null}
          <p className="pt-2 font-mono text-xs text-muted-foreground">{props.ticketNumber}</p>
        </div>
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR code du billet"
            className="mx-auto size-40 rounded-xl border border-border bg-background p-2"
          />
        ) : null}
      </div>
    </div>
  );
}
