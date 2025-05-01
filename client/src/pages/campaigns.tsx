import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CampaignCard } from "@/components/campaign-card";
import { Button } from "@/components/ui/button";
import { CampaignForm } from "@/components/campaign-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Campaign } from "@shared/schema";

export default function Campaigns() {
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  
  // Fetch all campaigns
  const { data: allCampaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });
  
  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
  });
  
  // Fetch rate limits
  const { data: rateLimits } = useQuery({
    queryKey: ['/api/ratelimits'],
  });
  
  // Filter campaigns by status
  const runningCampaigns = allCampaigns?.filter((c: Campaign) => c.status === 'running') || [];
  const pausedCampaigns = allCampaigns?.filter((c: Campaign) => c.status === 'paused') || [];
  const completedCampaigns = allCampaigns?.filter((c: Campaign) => 
    c.status === 'completed' || c.status === 'stopped'
  ) || [];
  const draftCampaigns = allCampaigns?.filter((c: Campaign) => c.status === 'draft') || [];
  
  // Get template for a campaign
  const getTemplateForCampaign = (campaignId: number) => {
    const campaign = allCampaigns?.find((c: Campaign) => c.id === campaignId);
    if (!campaign || !templates) return null;
    return templates.find(t => t.id === campaign.templateId);
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-discord-darker border-b border-discord-darkest py-4 px-6 flex items-center justify-between">
        <h2 className="text-white text-xl font-medium">Campaigns</h2>
        <div className="flex items-center space-x-4">
          <Button 
            className="bg-discord-primary hover:bg-discord-secondary text-white rounded-md flex items-center"
            onClick={() => setShowNewCampaignForm(!showNewCampaignForm)}
          >
            {showNewCampaignForm ? "Cancel" : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                New Campaign
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-discord p-6 bg-discord-dark">
        {showNewCampaignForm ? (
          <CampaignForm />
        ) : (
          <Tabs defaultValue="running" className="space-y-6">
            <TabsList className="bg-discord-darker border border-discord-darkest p-1 w-full justify-start">
              <TabsTrigger 
                value="running" 
                className="data-[state=active]:bg-discord-primary data-[state=active]:text-white"
              >
                Running ({runningCampaigns.length})
              </TabsTrigger>
              <TabsTrigger 
                value="paused"
                className="data-[state=active]:bg-discord-primary data-[state=active]:text-white"
              >
                Paused ({pausedCampaigns.length})
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                className="data-[state=active]:bg-discord-primary data-[state=active]:text-white"
              >
                Completed ({completedCampaigns.length})
              </TabsTrigger>
              <TabsTrigger 
                value="drafts"
                className="data-[state=active]:bg-discord-primary data-[state=active]:text-white"
              >
                Drafts ({draftCampaigns.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="running" className="space-y-6 mt-6">
              {campaignsLoading ? (
                <div className="text-discord-light text-center py-10">
                  Loading campaigns...
                </div>
              ) : runningCampaigns.length > 0 ? (
                runningCampaigns.map((campaign: Campaign) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign} 
                    template={getTemplateForCampaign(campaign.id)}
                    rateLimit={rateLimits?.messagesPerMinute || 5}
                  />
                ))
              ) : (
                <div className="text-discord-light text-center py-10">
                  No running campaigns at the moment.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="paused" className="space-y-6 mt-6">
              {campaignsLoading ? (
                <div className="text-discord-light text-center py-10">
                  Loading campaigns...
                </div>
              ) : pausedCampaigns.length > 0 ? (
                pausedCampaigns.map((campaign: Campaign) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign} 
                    template={getTemplateForCampaign(campaign.id)}
                    rateLimit={rateLimits?.messagesPerMinute || 5}
                  />
                ))
              ) : (
                <div className="text-discord-light text-center py-10">
                  No paused campaigns.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-6 mt-6">
              {campaignsLoading ? (
                <div className="text-discord-light text-center py-10">
                  Loading campaigns...
                </div>
              ) : completedCampaigns.length > 0 ? (
                completedCampaigns.map((campaign: Campaign) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign} 
                    template={getTemplateForCampaign(campaign.id)}
                    rateLimit={rateLimits?.messagesPerMinute || 5}
                  />
                ))
              ) : (
                <div className="text-discord-light text-center py-10">
                  No completed campaigns.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="drafts" className="space-y-6 mt-6">
              {campaignsLoading ? (
                <div className="text-discord-light text-center py-10">
                  Loading campaigns...
                </div>
              ) : draftCampaigns.length > 0 ? (
                draftCampaigns.map((campaign: Campaign) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign} 
                    template={getTemplateForCampaign(campaign.id)}
                    rateLimit={rateLimits?.messagesPerMinute || 5}
                  />
                ))
              ) : (
                <div className="text-discord-light text-center py-10">
                  No draft campaigns.
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
