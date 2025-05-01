import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogItem } from "@/components/log-item";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Campaign } from "@shared/schema";
import { CheckCircle, AlertCircle, AlertTriangle, Download } from "lucide-react";

export default function Logs() {
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [limit, setLimit] = useState<number>(100);

  // Fetch all logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: [selectedCampaign === "all" ? '/api/logs' : `/api/logs/campaign/${selectedCampaign}`, { limit }],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch all campaigns for filtering
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns']
  });

  // Filter logs based on search query and status filter
  const filteredLogs = logs?.filter(log => {
    const matchesSearch = searchQuery.length === 0 || 
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filter === "all" || log.status === filter;
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Count logs by status
  const successCount = logs?.filter(log => log.status === 'success').length || 0;
  const failedCount = logs?.filter(log => log.status === 'failed').length || 0;
  const skippedCount = logs?.filter(log => log.status === 'skipped').length || 0;

  // Handle export logs to CSV
  const exportLogsToCSV = () => {
    if (!logs || logs.length === 0) return;
    
    // Create CSV content
    const csvContent = [
      // Header row
      ["ID", "Campaign ID", "User ID", "Username", "Status", "Error Message", "Timestamp"].join(","),
      // Data rows
      ...filteredLogs.map(log => [
        log.id,
        log.campaignId,
        log.userId,
        `"${log.username.replace(/"/g, '""')}"`, // Escape quotes in username
        log.status,
        log.errorMessage ? `"${log.errorMessage.replace(/"/g, '""')}"` : "", // Escape quotes in error message
        new Date(log.timestamp).toISOString()
      ].join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `discord-dm-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-discord-darker border-b border-discord-darkest py-4 px-6 flex items-center justify-between">
        <h2 className="text-white text-xl font-medium">Message Logs</h2>
        <div className="flex items-center space-x-4">
          <Button 
            className="bg-discord-primary hover:bg-discord-secondary text-white rounded-md flex items-center"
            onClick={exportLogsToCSV}
            disabled={!logs || logs.length === 0}
          >
            <Download className="w-5 h-5 mr-2" />
            Export Logs
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-discord p-6 bg-discord-dark">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-discord-darker shadow-lg">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-discord-light text-sm font-medium">Successful Messages</p>
                <h3 className="text-discord-success text-2xl font-bold mt-1">{successCount}</h3>
              </div>
              <div className="p-3 bg-discord-success bg-opacity-20 rounded-full">
                <CheckCircle className="w-6 h-6 text-discord-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-discord-darker shadow-lg">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-discord-light text-sm font-medium">Failed Messages</p>
                <h3 className="text-discord-danger text-2xl font-bold mt-1">{failedCount}</h3>
              </div>
              <div className="p-3 bg-discord-danger bg-opacity-20 rounded-full">
                <AlertCircle className="w-6 h-6 text-discord-danger" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-discord-darker shadow-lg">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-discord-light text-sm font-medium">Skipped Messages</p>
                <h3 className="text-discord-warning text-2xl font-bold mt-1">{skippedCount}</h3>
              </div>
              <div className="p-3 bg-discord-warning bg-opacity-20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-discord-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-discord-darker shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-discord-light mb-2 text-sm font-medium">Campaign</label>
                <Select 
                  value={selectedCampaign} 
                  onValueChange={setSelectedCampaign}
                  disabled={campaignsLoading}
                >
                  <SelectTrigger className="bg-discord-darkest border-discord-dark text-white focus:ring-discord-primary">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent className="bg-discord-darkest border-discord-dark text-white">
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {!campaignsLoading && campaigns?.map((campaign: Campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-discord-light mb-2 text-sm font-medium">Status</label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="bg-discord-darkest border-discord-dark text-white focus:ring-discord-primary">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-discord-darkest border-discord-dark text-white">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-discord-light mb-2 text-sm font-medium">Search</label>
                <Input
                  type="text"
                  placeholder="Search by username or error..."
                  className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="bg-discord-darker shadow-lg">
          <CardHeader className="border-b border-discord-darkest px-6 py-4">
            <CardTitle className="text-white font-medium text-lg">Message Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="text-discord-light text-center py-10">
                Loading logs...
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="space-y-0 max-h-[600px] overflow-y-auto scrollbar-discord">
                {filteredLogs.map(log => (
                  <LogItem key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <div className="text-discord-light text-center py-10">
                No logs found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>

        {filteredLogs.length >= 100 && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              className="border-discord-dark text-discord-light hover:bg-discord-darkest"
              onClick={() => setLimit(prev => prev + 100)}
            >
              Load More
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
