import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Campaign, MessageTemplate } from "@shared/schema";
import { formatNumber, getTimeDifference, getEstimatedCompletionTime } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface CampaignCardProps {
  campaign: Campaign;
  template?: MessageTemplate;
  isActive?: boolean;
  rateLimit?: number;
}

export function CampaignCard({ 
  campaign, 
  template, 
  isActive = false,
  rateLimit = 5
}: CampaignCardProps) {
  const { toast } = useToast();
  
  const progress = campaign.totalMembers 
    ? Math.min(100, Math.round(((campaign.messagesSent + campaign.messagesFailed) / campaign.totalMembers) * 100)) 
    : 0;
  
  const deliveryRate = (campaign.messagesSent + campaign.messagesFailed) > 0
    ? Math.round((campaign.messagesSent / (campaign.messagesSent + campaign.messagesFailed)) * 100)
    : 0;
  
  const startedTimeText = campaign.startedAt 
    ? getTimeDifference(campaign.startedAt)
    : 'Not started';
  
  const estimatedCompletion = campaign.totalMembers && campaign.status === 'running'
    ? getEstimatedCompletionTime(campaign.totalMembers, campaign.messagesSent, rateLimit)
    : '';
  
  async function handlePause() {
    try {
      await apiRequest('PATCH', `/api/campaigns/${campaign.id}`, { status: 'paused' });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaign.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/status/running'] });
      toast({
        title: "Campaign paused",
        description: "The campaign has been paused successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause campaign",
        variant: "destructive",
      });
    }
  }
  
  async function handleResume() {
    try {
      await apiRequest('PATCH', `/api/campaigns/${campaign.id}`, { status: 'running' });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaign.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/status/paused'] });
      toast({
        title: "Campaign resumed",
        description: "The campaign has been resumed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume campaign",
        variant: "destructive",
      });
    }
  }
  
  async function handleStop() {
    try {
      await apiRequest('PATCH', `/api/campaigns/${campaign.id}`, { status: 'stopped' });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaign.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/status/running'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/status/paused'] });
      toast({
        title: "Campaign stopped",
        description: "The campaign has been stopped successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop campaign",
        variant: "destructive",
      });
    }
  }
  
  function getCampaignBadge() {
    switch (campaign.status) {
      case 'running':
        return <Badge className="bg-discord-success bg-opacity-10 text-discord-success">Running</Badge>;
      case 'paused':
        return <Badge className="bg-discord-warning bg-opacity-10 text-discord-warning">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-discord-info bg-opacity-10 text-discord-info">Completed</Badge>;
      case 'stopped':
        return <Badge className="bg-discord-danger bg-opacity-10 text-discord-danger">Stopped</Badge>;
      default:
        return <Badge className="bg-discord-light bg-opacity-10 text-discord-light">Draft</Badge>;
    }
  }
  
  return (
    <Card className="bg-discord-darker shadow-lg overflow-hidden">
      <CardHeader className={isActive ? "border-b border-discord-darkest px-6 py-4" : "px-6 py-4"}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white font-medium text-lg">{isActive ? "Active Campaign" : campaign.name}</CardTitle>
          {(campaign.status === 'running' || campaign.status === 'paused') && (
            <div className="flex space-x-2">
              {campaign.status === 'running' && (
                <Button 
                  onClick={handlePause}
                  className="bg-discord-danger bg-opacity-10 text-discord-danger hover:bg-opacity-20"
                  size="sm"
                >
                  Pause
                </Button>
              )}
              {campaign.status === 'paused' && (
                <Button 
                  onClick={handleResume}
                  className="bg-discord-success bg-opacity-10 text-discord-success hover:bg-opacity-20"
                  size="sm"
                >
                  Resume
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="bg-discord-danger hover:bg-discord-danger/80 text-white"
                    size="sm"
                  >
                    Stop
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-discord-darker border-discord-darkest">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Stop Campaign</AlertDialogTitle>
                    <AlertDialogDescription className="text-discord-light">
                      Are you sure you want to stop this campaign? This action cannot be undone and all remaining messages will be removed from the queue.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-discord-darkest text-discord-light border-none hover:bg-discord-dark hover:text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-discord-danger hover:bg-discord-danger/80 text-white"
                      onClick={handleStop}
                    >
                      Stop Campaign
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          {!isActive && getCampaignBadge()}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-white font-medium">{campaign.name}</h4>
            <p className="text-discord-light text-sm mt-1">Started {startedTimeText}</p>
          </div>
          {isActive && getCampaignBadge()}
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-discord-light text-sm">Progress</span>
            <span className="text-discord-light text-sm">
              {formatNumber(campaign.messagesSent + campaign.messagesFailed)} / {formatNumber(campaign.totalMembers || 0)}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-discord-darkest" indicatorClassName="bg-discord-success" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-discord-darkest bg-opacity-50 rounded p-3">
            <p className="text-discord-light text-sm">Messages Sent</p>
            <p className="text-white font-medium mt-1">{formatNumber(campaign.messagesSent)}</p>
          </div>
          <div className="bg-discord-darkest bg-opacity-50 rounded p-3">
            <p className="text-discord-light text-sm">Delivery Rate</p>
            <p className="text-white font-medium mt-1">{deliveryRate}%</p>
          </div>
          <div className="bg-discord-darkest bg-opacity-50 rounded p-3">
            <p className="text-discord-light text-sm">Rate Limit</p>
            <p className="text-discord-success font-medium mt-1">{rateLimit} msg/min</p>
            {estimatedCompletion && (
              <p className="text-discord-info text-xs mt-1">Est: {estimatedCompletion}</p>
            )}
          </div>
        </div>

        {template && (
          <div className="bg-discord-darkest rounded p-4">
            <h4 className="text-white font-medium mb-2">Message Template</h4>
            <div className="bg-discord-dark rounded p-3 text-discord-light text-sm">
              <p>{template.content}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
