import { Button } from "@/components/ui/button";
import { History, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppHeaderProps {
  user: any | null;
  onShowHistory: () => void;
  onNavigateToAccount: () => void;
  onSignOut: () => void;
  onSignUp: () => void;
}

export const AppHeader = ({
  user,
  onShowHistory,
  onNavigateToAccount,
  onSignOut,
  onSignUp,
}: AppHeaderProps) => {
  if (!user) {
    return (
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="outline"
          className="bg-black/20 hover:bg-black/40 border-white/20 text-white backdrop-blur-sm"
          onClick={onSignUp}
        >
          Sign Up
        </Button>
      </div>
    );
  }

  const initials = user.email
    ?.split("@")[0]
    .substring(0, 2)
    .toUpperCase() || "U";

  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-black/20 hover:bg-black/40 border-white/20 text-white backdrop-blur-sm"
              onClick={onShowHistory}
            >
              <History className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Session History</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-black/20 hover:bg-black/40 border-white/20 backdrop-blur-sm p-0 w-10 h-10"
          >
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onNavigateToAccount}>
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShowHistory}>
            <History className="mr-2 h-4 w-4" />
            <span>Session History</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
