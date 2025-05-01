import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// Icons
import { 
  Layers,
  MessageCircle,
  FileText,
  FileEdit,
  Settings,
  Gauge,
  LogOut,
  User
} from "lucide-react";

interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/auth");
  };

  return (
    <div className="bg-sidebar w-64 flex-shrink-0 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="font-semibold text-sidebar-foreground text-xl flex items-center">
          <svg className="h-6 w-6 mr-2 fill-current" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          DM Bot
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-discord pt-4">
        <div className="px-4 mb-2 text-sidebar-foreground text-sm font-semibold uppercase tracking-wider">
          Main
        </div>
        <NavLink href="/" icon={<Layers />} label="Dashboard" isActive={currentPath === "/"} />
        <NavLink href="/campaigns" icon={<MessageCircle />} label="Campaigns" isActive={currentPath === "/campaigns"} />
        <NavLink href="/logs" icon={<FileText />} label="Logs" isActive={currentPath === "/logs"} />
        <NavLink href="/templates" icon={<FileEdit />} label="Templates" isActive={currentPath === "/templates"} />
        
        <div className="px-4 my-2 text-sidebar-foreground text-sm font-semibold uppercase tracking-wider">
          Settings
        </div>
        <NavLink href="/settings" icon={<Settings />} label="Bot Settings" isActive={currentPath === "/settings"} />
        
        <div className="px-4 my-2 text-sidebar-foreground text-sm font-semibold uppercase tracking-wider">
          Account
        </div>
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center px-4 py-2 rounded mx-2 mt-1 transition-colors w-full text-left",
            "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <span className="h-5 w-5 mr-3"><LogOut /></span>
          Logout
        </button>
      </nav>
      <BotStatus />
    </div>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavLink({ href, icon, label, isActive }: NavLinkProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center px-4 py-2 rounded mx-2 mt-1 transition-colors cursor-pointer",
        isActive 
          ? "text-sidebar-foreground bg-sidebar-primary bg-opacity-30" 
          : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
      )}>
        <span className="h-5 w-5 mr-3">{icon}</span>
        {label}
      </div>
    </Link>
  );
}

function BotStatus() {
  return (
    <div className="p-4 border-t border-sidebar-border">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-discord-primary flex items-center justify-center text-white font-bold">
          <Gauge size={20} />
        </div>
        <div className="ml-3">
          <div className="text-sidebar-foreground font-medium">DM Bot</div>
          <div className="text-sidebar-foreground text-xs opacity-75">Disconnected</div>
        </div>
      </div>
    </div>
  );
}
