import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/stats-card";
import { CampaignCard } from "@/components/campaign-card";
import { RateLimitMonitor } from "@/components/rate-limit-monitor";
import { LogItem } from "@/components/log-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowUp, ArrowDown, Users, MessageCircle, Clock } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { CampaignForm } from "@/components/campaign-form";

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch active campaign
  const { data: activeCampaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns/status/running'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch templates for active campaign
  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
  });

  // Fetch recent logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/logs'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get active campaign if any
  const activeCampaign = activeCampaigns && activeCampaigns.length > 0 
    ? activeCampaigns[0] 
    : null;

  // Get template for active campaign
  const activeCampaignTemplate = activeCampaign && templates 
    ? templates.find(t => t.id === activeCampaign.templateId) 
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-discord-darker border-b border-discord-darkest py-4 px-6 flex items-center justify-between">
        <h2 className="text-white text-xl font-medium">Dashboard</h2>
        <div className="flex items-center space-x-4">
          <Link href="/campaigns">
            <Button className="bg-discord-primary hover:bg-discord-secondary text-white rounded-md flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              New Campaign
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-discord p-6 bg-discord-dark">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatsCard 
            title="Total Members" 
            value={statsLoading ? "Loading..." : formatNumber(stats?.totalMembers || 0)}
            icon={Users}
            iconColor="text-discord-primary"
            iconBgColor="bg-discord-primary bg-opacity-20"
            footerText="Across all servers"
            footerIcon={<ArrowUp className="w-4 h-4" />}
            footerColor="text-discord-success"
          />
          
          <StatsCard 
            title="Messages Sent" 
            value={statsLoading ? "Loading..." : formatNumber(stats?.messagesSent || 0)}
            icon={MessageCircle}
            iconColor="text-discord-info"
            iconBgColor="bg-discord-info bg-opacity-20"
            footerText={statsLoading ? "" : `${stats?.deliveryRate || 0}% success rate`}
            footerIcon={stats?.deliveryRate > 80 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            footerColor={stats?.deliveryRate > 80 ? "text-discord-success" : "text-discord-warning"}
          />
          
          <StatsCard 
            title="Queue Status" 
            value={statsLoading ? "Loading..." : formatNumber(stats?.queueLength || 0)}
            icon={Clock}
            iconColor="text-discord-warning"
            iconBgColor="bg-discord-warning bg-opacity-20"
            footerText={statsLoading || !stats?.queueLength ? "No messages in queue" : "Messages waiting to be sent"}
            footerColor="text-discord-info"
          />
        </div>

        {/* Active Campaign Section */}
        {activeCampaign ? (
          <div className="mb-6">
            <CampaignCard 
              campaign={activeCampaign} 
              template={activeCampaignTemplate} 
              isActive={true}
              rateLimit={stats?.rateLimits?.messagesPerMinute || 5}
            />
          </div>
        ) : (
          <div className="mb-6 bg-discord-darker rounded-lg shadow-lg overflow-hidden">
            <div className="border-b border-discord-darkest px-6 py-4">
              <h3 className="text-white font-medium text-lg">No Active Campaigns</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-discord-light mb-4">You don't have any running campaigns at the moment.</p>
              <Link href="/campaigns">
                <Button className="bg-discord-primary hover:bg-discord-secondary text-white">
                  Start a Campaign
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Rate Limiting Monitor and Recent Logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <RateLimitMonitor />
          
          <Card className="bg-discord-darker shadow-lg overflow-hidden">
            <CardHeader className="border-b border-discord-darkest px-6 py-4 flex justify-between items-center">
              <CardTitle className="text-white font-medium text-lg">Recent Logs</CardTitle>
              <Link href="/logs">
                <Button variant="link" className="text-discord-light text-sm hover:text-white p-0">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 max-h-[295px] overflow-y-auto scrollbar-discord">
                {logsLoading ? (
                  <p className="text-discord-light text-center">Loading logs...</p>
                ) : logs && logs.length > 0 ? (
                  logs.slice(0, 5).map(log => (
                    <LogItem key={log.id} log={log} />
                  ))
                ) : (
                  <p className="text-discord-light text-center">No logs available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create New Campaign Card */}
        <CampaignForm />
      </main>
    </div>
  );
}
