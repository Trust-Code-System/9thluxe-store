import { ShieldCheck, PackageCheck, ScanLine, LifeBuoy } from "lucide-react";
import type { PdpData } from "@/lib/pdp/types";

const STATUS_COPY: Record<
  PdpData["authenticity"]["status"],
  { label: string; detail: string }
> = {
  RETAILER_INSPECTED: {
    label: "Retailer-inspected",
    detail:
      "Every bottle is inspected and sealed by our team before dispatch. We source only through verified suppliers.",
  },
  MANUFACTURER_VERIFIED: {
    label: "Manufacturer-verified",
    detail:
      "This product is verified through the manufacturer's own authentication process.",
  },
};

/**
 * Confidence-building authenticity module. Shows ONLY what is genuinely true for this product: the
 * real authenticity status, and batch/verification data when present. It never claims manufacturer,
 * blockchain, or guaranteed batch authentication unless that status is actually set.
 */
export function Authenticity({
  authenticity,
}: {
  authenticity: PdpData["authenticity"];
}) {
  const status = STATUS_COPY[authenticity.status];
  const verifiedDate = authenticity.lastVerifiedAt
    ? new Date(authenticity.lastVerifiedAt).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 h-6 w-6 shrink-0 text-accent"
            aria-hidden
          />
          <div>
            <p className="font-serif text-lg">{status.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {status.detail}
            </p>
            <dl className="mt-4 space-y-1.5 text-sm">
              {authenticity.batchInfo && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Batch guidance:</dt>
                  <dd className="font-medium">{authenticity.batchInfo}</dd>
                </div>
              )}
              {verifiedDate && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Last verified:</dt>
                  <dd className="font-medium">{verifiedDate}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      <ul className="space-y-3 text-sm">
        <Guidance
          icon={<PackageCheck className="h-4 w-4" />}
          title="Check the seal"
        >
          Bottles arrive factory-sealed in intact packaging. Inspect the
          cellophane and cap before first use.
        </Guidance>
        <Guidance
          icon={<ScanLine className="h-4 w-4" />}
          title="Inspect packaging & batch code"
        >
          Compare the batch code on the box and bottle. They should match.
          Report any discrepancy to us.
        </Guidance>
        <Guidance
          icon={<LifeBuoy className="h-4 w-4" />}
          title="Report a concern"
        >
          Something looks off? {""}
          <a
            href="/help#authenticity"
            className="text-accent underline underline-offset-2"
          >
            Contact support
          </a>{" "}
          and we&apos;ll investigate and make it right.
        </Guidance>
      </ul>
    </div>
  );
}

function Guidance({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3.5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background text-accent">
        {icon}
      </span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {children}
        </p>
      </div>
    </li>
  );
}
