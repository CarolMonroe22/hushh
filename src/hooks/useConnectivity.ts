import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Simple connectivity hook to surface online/offline changes across the app
export const useConnectivity = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleOffline = () =>
      toast({
        title: "You're offline",
        description: "You're offline. Some features may not work.",
        variant: "destructive",
      });

    const handleOnline = () =>
      toast({
        title: "Back online",
        description: "Connection restored.",
      });

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (typeof navigator !== "undefined" && navigator && !navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [toast]);
};

export default useConnectivity;
