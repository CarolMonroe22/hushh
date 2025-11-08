import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const getMeta = (name: string) =>
  (document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null)?.content || "";

const EnvBanner = () => {
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);

  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isTempHost = useMemo(
    () => host.includes("lovableproject.com") || host.startsWith("preview--"),
    [host]
  );

  const primaryDomain = useMemo(() => getMeta("x-primary-domain") || "", []);
  const autoRedirect = useMemo(() => getMeta("x-auto-redirect") === "true", []);

  const stableUrl = useMemo(() => {
    if (!primaryDomain) return "";
    const { pathname, search, hash } = window.location;
    return `https://${primaryDomain}${pathname}${search}${hash}`;
  }, [primaryDomain]);

  useEffect(() => {
    if (isTempHost && autoRedirect && primaryDomain) {
      const t = setTimeout(() => {
        window.location.replace(stableUrl);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isTempHost, autoRedirect, primaryDomain, stableUrl]);

  if (!isTempHost || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-3xl px-4 pb-4">
        <div className="rounded-lg border bg-secondary text-secondary-foreground shadow-sm">
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              You're viewing a temporary link. Use the stable link to share without issues.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  const urlToCopy = stableUrl || window.location.href;
                  navigator.clipboard
                    .writeText(urlToCopy)
                    .then(() =>
                      toast({ title: "Link copied", description: urlToCopy })
                    )
                    .catch(() =>
                      toast({
                        title: "Could not copy",
                        description: "Copy manually from the address bar.",
                        variant: "destructive",
                      })
                    );
                }}
              >
                Copy link
              </Button>
              <Button
                onClick={() => {
                  if (stableUrl) {
                    window.location.href = stableUrl;
                  } else {
                    toast({
                      title: "Stable link not configured",
                      description:
                        "Publish the site with a stable subdomain or define x-primary-domain.",
                    });
                  }
                }}
                disabled={!stableUrl}
              >
                Open stable link
              </Button>
              <Button variant="ghost" onClick={() => setDismissed(true)} aria-label="Close banner">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvBanner;
