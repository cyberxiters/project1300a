import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Close the mobile nav when a link is clicked
  const handleNavigation = () => {
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[80%] max-w-sm pt-10">
          <nav className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold">Discord Messenger</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <Link href="/">
              <a 
                className={`px-4 py-2 rounded-md transition-colors ${
                  location === "/" 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                }`}
                onClick={handleNavigation}
              >
                Dashboard
              </a>
            </Link>
            
            <Link href="/campaigns">
              <a 
                className={`px-4 py-2 rounded-md transition-colors ${
                  location === "/campaigns" 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                }`}
                onClick={handleNavigation}
              >
                Campaigns
              </a>
            </Link>
            
            <Link href="/templates">
              <a 
                className={`px-4 py-2 rounded-md transition-colors ${
                  location === "/templates" 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                }`}
                onClick={handleNavigation}
              >
                Templates
              </a>
            </Link>
            
            <Link href="/logs">
              <a 
                className={`px-4 py-2 rounded-md transition-colors ${
                  location === "/logs" 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                }`}
                onClick={handleNavigation}
              >
                Logs
              </a>
            </Link>
            
            <Link href="/settings">
              <a 
                className={`px-4 py-2 rounded-md transition-colors ${
                  location === "/settings" 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                }`}
                onClick={handleNavigation}
              >
                Settings
              </a>
            </Link>
            
            <div className="mt-auto">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}