import { Home, Users, Sparkles, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  onClick?: () => void;
}

interface BottomNavigationProps {
  onOpenLibrary?: () => void;
}

export const BottomNavigation = ({ onOpenLibrary }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems: NavItem[] = [
    { icon: <Home className="h-5 w-5" />, label: "home", path: "/" },
    { icon: <Users className="h-5 w-5" />, label: "community", path: "/community" },
    { icon: <Sparkles className="h-5 w-5" />, label: "vibes", path: "#library", onClick: onOpenLibrary },
    { icon: <User className="h-5 w-5" />, label: "account", path: "/account" },
  ];

  const isActive = (path: string) => {
    if (path === "#library") return false;
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border/50 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 h-full transition-all",
              isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.icon}
            <span className="text-[10px] lowercase tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
