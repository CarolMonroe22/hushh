import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Simple connectivity hook to surface online/offline changes across the app
export const useConnectivity = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleOffline = () =>
      toast({
        title: "Sin conexión",
        description: "Estás offline. Algunas funciones pueden no funcionar.",
        variant: "destructive",
      });

    const handleOnline = () =>
      toast({
        title: "De nuevo en línea",
        description: "La conexión se ha restablecido.",
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
