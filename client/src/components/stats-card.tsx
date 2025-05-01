import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  footerText?: string;
  footerIcon?: React.ReactNode;
  footerColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-discord-primary",
  iconBgColor = "bg-discord-primary bg-opacity-20",
  footerText,
  footerIcon,
  footerColor = "text-discord-success"
}: StatsCardProps) {
  return (
    <Card className="bg-discord-darker shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-discord-light text-sm font-medium">{title}</p>
            <h3 className="text-white text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={cn("p-3 rounded-full", iconBgColor)}>
            <Icon className={cn("w-6 h-6", iconColor)} />
          </div>
        </div>
        
        {footerText && (
          <div className="mt-4 flex items-center text-sm">
            <span className={cn("flex items-center", footerColor)}>
              {footerIcon && <span className="mr-1">{footerIcon}</span>}
              {footerText}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
