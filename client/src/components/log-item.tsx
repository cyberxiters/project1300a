import { cn } from "@/lib/utils";
import { getTimeDifference } from "@/lib/utils";
import { MessageLog } from "@shared/schema";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface LogItemProps {
  log: MessageLog;
}

export function LogItem({ log }: LogItemProps) {
  function getStatusIcon() {
    switch (log.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-discord-success" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-discord-danger" />;
      case 'skipped':
        return <AlertTriangle className="w-5 h-5 text-discord-warning" />;
      default:
        return <Info className="w-5 h-5 text-discord-info" />;
    }
  }
  
  function getLogMessage() {
    switch (log.status) {
      case 'success':
        return <>Message sent to <span className="font-medium">{log.username}</span></>;
      case 'failed':
        return <>Failed to send message to <span className="font-medium">{log.username}</span>{log.errorMessage ? ` - ${log.errorMessage}` : ''}</>;
      case 'skipped':
        return <>Skipped message to <span className="font-medium">{log.username}</span>{log.errorMessage ? ` - ${log.errorMessage}` : ''}</>;
      default:
        return <>Log entry for <span className="font-medium">{log.username}</span></>;
    }
  }
  
  return (
    <div className="flex items-start gap-3 p-2 rounded hover:bg-discord-darkest">
      <div className="w-5 h-5 mt-0.5 flex-shrink-0">
        {getStatusIcon()}
      </div>
      <div>
        <p className="text-white text-sm">{getLogMessage()}</p>
        <p className="text-discord-light text-xs mt-0.5">{getTimeDifference(log.timestamp)}</p>
      </div>
    </div>
  );
}
