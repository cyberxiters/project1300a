import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export function RateLimitMonitor() {
  const { data: rateLimits, isLoading } = useQuery({
    queryKey: ['/api/ratelimits'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });
  
  if (isLoading) {
    return (
      <Card className="bg-discord-darker shadow-lg overflow-hidden animate-pulse">
        <CardHeader className="border-b border-discord-darkest px-6 py-4">
          <CardTitle className="text-white font-medium text-lg">Rate Limit Monitor</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-48 flex items-center justify-center">
            <p className="text-discord-light">Loading rate limits...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!rateLimits) {
    return (
      <Card className="bg-discord-darker shadow-lg overflow-hidden">
        <CardHeader className="border-b border-discord-darkest px-6 py-4">
          <CardTitle className="text-white font-medium text-lg">Rate Limit Monitor</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-48 flex flex-col items-center justify-center">
            <p className="text-discord-light mb-4">Rate limit settings not found</p>
            <Link href="/settings">
              <Button className="bg-discord-primary hover:bg-discord-secondary text-white">
                Configure Rate Limits
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate usage percentages
  const messagesPerMinutePercent = Math.min(
    100, 
    Math.round((rateLimits.currentRate / rateLimits.messagesPerMinute) * 100)
  );
  
  const apiUsagePercent = rateLimits.usage ? Math.round(rateLimits.usage * 100) : 0;
  const cooldownPercent = Math.min(25, Math.round(25));  // Just for visual representation
  
  const getStatusBadge = () => {
    if (apiUsagePercent > 90) {
      return <Badge className="bg-discord-danger bg-opacity-10 text-discord-danger">Critical</Badge>;
    } else if (apiUsagePercent > 70) {
      return <Badge className="bg-discord-warning bg-opacity-10 text-discord-warning">Warning</Badge>;
    } else {
      return <Badge className="bg-discord-success bg-opacity-10 text-discord-success">Healthy</Badge>;
    }
  };
  
  return (
    <Card className="bg-discord-darker shadow-lg overflow-hidden">
      <CardHeader className="border-b border-discord-darkest px-6 py-4">
        <CardTitle className="text-white font-medium text-lg">Rate Limit Monitor</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-white font-medium">Current Status</h4>
            <p className="text-discord-light text-sm mt-1">Following Discord ToS limits</p>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-discord-light text-sm">Messages per minute</span>
              <span className="text-discord-light text-sm">
                {rateLimits.currentRate} / {rateLimits.messagesPerMinute}
              </span>
            </div>
            <Progress 
              value={messagesPerMinutePercent} 
              className="h-2 bg-discord-darkest" 
              indicatorClassName="bg-discord-primary" 
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-discord-light text-sm">API usage</span>
              <span className="text-discord-light text-sm">{apiUsagePercent}%</span>
            </div>
            <Progress 
              value={apiUsagePercent} 
              className="h-2 bg-discord-darkest" 
              indicatorClassName="bg-discord-primary" 
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-discord-light text-sm">Cooldown</span>
              <span className="text-discord-light text-sm">{rateLimits.cooldownSeconds}s</span>
            </div>
            <Progress 
              value={cooldownPercent} 
              className="h-2 bg-discord-darkest" 
              indicatorClassName="bg-discord-primary" 
            />
          </div>
        </div>
        
        <div className="mt-4">
          <Link href="/settings">
            <Button variant="link" className="text-discord-light text-sm hover:text-white p-0">
              Adjust rate limit settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
