import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  ShieldAlert, 
  Clock, 
  Server, 
  Plus, 
  Key, 
  Trash2, 
  Power 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { insertRateLimitSchema, insertBotSettingsSchema, insertBotTokenSchema } from "@shared/schema";
import { cn, formatDate } from "@/lib/utils";

// Rate limit form schema
const rateLimitFormSchema = insertRateLimitSchema;
type RateLimitFormValues = z.infer<typeof rateLimitFormSchema>;

// Bot settings form schema
const botSettingsFormSchema = z.object({
  token: z.string().min(1, "Bot token is required"),
});
type BotSettingsFormValues = z.infer<typeof botSettingsFormSchema>;

// Bot token form schema
const botTokenFormSchema = insertBotTokenSchema.extend({
  token: z.string().min(50, "Bot token must be at least 50 characters")
});
type BotTokenFormValues = z.infer<typeof botTokenFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [isActivatingToken, setIsActivatingToken] = useState(false);
  const [isDeletingToken, setIsDeletingToken] = useState(false);
  const [addTokenOpen, setAddTokenOpen] = useState(false);

  // Fetch rate limits
  const { data: rateLimits, isLoading: rateLimitsLoading } = useQuery({
    queryKey: ['/api/ratelimits'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch bot settings
  const { data: botStatus, isLoading: botStatusLoading } = useQuery({
    queryKey: ['/api/bot/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch bot settings
  const { data: botSettings, isLoading: botSettingsLoading } = useQuery({
    queryKey: ['/api/bot/settings'],
  });
  
  // Fetch bot tokens
  const { data: botTokens, isLoading: botTokensLoading } = useQuery({
    queryKey: ['/api/bot/tokens'],
  });

  // Rate limit form
  const rateLimitForm = useForm<RateLimitFormValues>({
    resolver: zodResolver(rateLimitFormSchema),
    defaultValues: {
      messagesPerMinute: 5,
      cooldownSeconds: 15,
      maxQueueSize: 10000
    }
  });

  // Bot settings form
  const botSettingsForm = useForm<BotSettingsFormValues>({
    resolver: zodResolver(botSettingsFormSchema),
    defaultValues: {
      token: ""
    }
  });
  
  // Bot token form
  const botTokenForm = useForm<BotTokenFormValues>({
    resolver: zodResolver(botTokenFormSchema),
    defaultValues: {
      name: "",
      token: "",
      isActive: true
    }
  });

  // Update forms when data is loaded
  useEffect(() => {
    if (rateLimits) {
      rateLimitForm.reset({
        messagesPerMinute: rateLimits.messagesPerMinute,
        cooldownSeconds: rateLimits.cooldownSeconds,
        maxQueueSize: rateLimits.maxQueueSize
      });
    }
  }, [rateLimits, rateLimitForm]);

  // Mutations
  const updateRateLimitsMutation = useMutation({
    mutationFn: async (data: RateLimitFormValues) => {
      const response = await apiRequest('POST', '/api/ratelimits', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ratelimits'] });
      toast({
        title: "Rate limits updated",
        description: "Your rate limit settings have been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update rate limits: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const connectBotMutation = useMutation({
    mutationFn: async (data: { token?: string, tokenId?: number }) => {
      setIsConnecting(true);
      const response = await apiRequest('POST', '/api/bot/connect', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/guilds'] });
      toast({
        title: "Bot connected",
        description: "Your Discord bot has been connected successfully",
      });
      setIsConnecting(false);
    },
    onError: (error) => {
      toast({
        title: "Connection error",
        description: `Failed to connect bot: ${error.message}`,
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  });

  const disconnectBotMutation = useMutation({
    mutationFn: async () => {
      setIsDisconnecting(true);
      const response = await apiRequest('POST', '/api/bot/disconnect', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/settings'] });
      toast({
        title: "Bot disconnected",
        description: "Your Discord bot has been disconnected successfully",
      });
      setIsDisconnecting(false);
    },
    onError: (error) => {
      toast({
        title: "Disconnection error",
        description: `Failed to disconnect bot: ${error.message}`,
        variant: "destructive",
      });
      setIsDisconnecting(false);
    }
  });
  
  // Token mutations
  const addTokenMutation = useMutation({
    mutationFn: async (data: BotTokenFormValues) => {
      setIsAddingToken(true);
      const response = await apiRequest('POST', '/api/bot/tokens', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/tokens'] });
      toast({
        title: "Token added",
        description: "Your Discord bot token has been added successfully",
      });
      setIsAddingToken(false);
      setAddTokenOpen(false);
      botTokenForm.reset({
        name: "",
        token: "",
        isActive: true
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add token: ${error.message}`,
        variant: "destructive",
      });
      setIsAddingToken(false);
    }
  });
  
  const activateTokenMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsActivatingToken(true);
      const response = await apiRequest('PATCH', `/api/bot/tokens/${id}/activate`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/settings'] });
      toast({
        title: "Token activated",
        description: "The bot token has been activated successfully",
      });
      setIsActivatingToken(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to activate token: ${error.message}`,
        variant: "destructive",
      });
      setIsActivatingToken(false);
    }
  });
  
  const deleteTokenMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsDeletingToken(true);
      const response = await apiRequest('DELETE', `/api/bot/tokens/${id}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/tokens'] });
      toast({
        title: "Token deleted",
        description: "The bot token has been deleted successfully",
      });
      setIsDeletingToken(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete token: ${error.message}`,
        variant: "destructive",
      });
      setIsDeletingToken(false);
    }
  });

  // Form submission handlers
  const onRateLimitSubmit = (data: RateLimitFormValues) => {
    updateRateLimitsMutation.mutate(data);
  };

  const onBotSettingsSubmit = (data: BotSettingsFormValues) => {
    connectBotMutation.mutate({ token: data.token });
  };
  
  const onBotTokenSubmit = (data: BotTokenFormValues) => {
    addTokenMutation.mutate(data);
  };

  const handleConnectBot = () => {
    // If we already have a token saved, connect without a new token
    if (botSettings?.status === 'offline') {
      connectBotMutation.mutate({});
    } else {
      // Otherwise, submit the form to connect with a new token
      botSettingsForm.handleSubmit(onBotSettingsSubmit)();
    }
  };

  const handleDisconnectBot = () => {
    disconnectBotMutation.mutate();
  };
  
  const handleActivateToken = (id: number) => {
    activateTokenMutation.mutate(id);
  };
  
  const handleDeleteToken = (id: number) => {
    if (confirm("Are you sure you want to delete this token?")) {
      deleteTokenMutation.mutate(id);
    }
  };
  
  const handleConnectWithToken = (id: number) => {
    if (botStatus?.status === 'online') {
      if (confirm("Bot is already connected. Disconnect first?")) {
        disconnectBotMutation.mutate();
      }
      return;
    }
    
    connectBotMutation.mutate({ tokenId: id });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-discord-darker border-b border-discord-darkest py-4 px-6 flex items-center justify-between">
        <h2 className="text-white text-xl font-medium">Bot Settings</h2>
        <div className="flex items-center space-x-4">
          {!botStatusLoading && botStatus?.status === 'online' ? (
            <Button 
              className="bg-discord-danger hover:bg-discord-danger/80 text-white rounded-md flex items-center"
              onClick={handleDisconnectBot}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              Disconnect Bot
            </Button>
          ) : (
            <Button 
              className="bg-discord-success hover:bg-discord-success/80 text-white rounded-md flex items-center"
              onClick={handleConnectBot}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Connect Bot
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-discord p-6 bg-discord-dark">
        <Tabs defaultValue="bot" className="space-y-6">
          <TabsList className="bg-discord-darker border border-discord-darkest p-1 w-full justify-start">
            <TabsTrigger 
              value="bot" 
              className="data-[state=active]:bg-discord-primary data-[state=active]:text-white"
            >
              Bot Settings
            </TabsTrigger>
            <TabsTrigger 
              value="rate-limits"
              className="data-[state=active]:bg-discord-primary data-[state=active]:text-white"
            >
              Rate Limits
            </TabsTrigger>
          </TabsList>
          
          {/* Bot Settings Tab */}
          <TabsContent value="bot" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-discord-darker shadow-lg">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-discord-light text-sm font-medium">Bot Status</p>
                    <h3 className={cn(
                      "text-2xl font-bold mt-1",
                      botStatus?.status === 'online' ? 'text-discord-success' : 'text-discord-danger'
                    )}>
                      {botStatusLoading ? "Loading..." : (
                        botStatus?.status === 'online' ? "Online" : "Offline"
                      )}
                    </h3>
                  </div>
                  <div className={cn(
                    "p-3 rounded-full",
                    botStatus?.status === 'online' 
                      ? "bg-discord-success bg-opacity-20" 
                      : "bg-discord-danger bg-opacity-20"
                  )}>
                    <Server className={cn(
                      "w-6 h-6",
                      botStatus?.status === 'online' ? "text-discord-success" : "text-discord-danger"
                    )} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-discord-darker shadow-lg">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-discord-light text-sm font-medium">Connection Status</p>
                    <h3 className="text-discord-info text-2xl font-bold mt-1">
                      {botStatus?.lastConnectedAt 
                        ? "Connected" 
                        : "Never Connected"}
                    </h3>
                  </div>
                  <div className="p-3 bg-discord-info bg-opacity-20 rounded-full">
                    <Clock className="w-6 h-6 text-discord-info" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-discord-darker shadow-lg">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-discord-light text-sm font-medium">Security</p>
                    <h3 className="text-discord-warning text-2xl font-bold mt-1">
                      {botSettingsLoading ? "Loading..." : (
                        botSettings?.token ? "Configured" : "Not Set"
                      )}
                    </h3>
                  </div>
                  <div className="p-3 bg-discord-warning bg-opacity-20 rounded-full">
                    <ShieldAlert className="w-6 h-6 text-discord-warning" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Bot Tokens Card */}
            <Card className="bg-discord-darker shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Bot Tokens</CardTitle>
                    <CardDescription className="text-discord-light">
                      Manage your Discord bot tokens.
                    </CardDescription>
                  </div>
                  <Dialog open={addTokenOpen} onOpenChange={setAddTokenOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-discord-success hover:bg-discord-success/80 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Token
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-discord-darker border-discord-dark text-white">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add New Bot Token</DialogTitle>
                        <DialogDescription className="text-discord-light">
                          Add a new Discord bot token to use with your campaigns.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...botTokenForm}>
                        <form onSubmit={botTokenForm.handleSubmit(onBotTokenSubmit)} className="space-y-4">
                          <FormField
                            control={botTokenForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-discord-light">Token Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="My Discord Bot"
                                    className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-discord-light text-xs">
                                  A name to identify this token (e.g., "Production Bot", "Test Bot")
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={botTokenForm.control}
                            name="token"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-discord-light">Bot Token</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="Enter your Discord bot token"
                                    className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-discord-light text-xs">
                                  The token for your Discord bot from the Discord Developer Portal
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={botTokenForm.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-discord-dark p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-discord-light">Set as Active</FormLabel>
                                  <FormDescription className="text-discord-light text-xs">
                                    Make this token the active token for the bot
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-discord-primary"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <DialogFooter className="mt-6">
                            <Button type="button" variant="secondary" onClick={() => setAddTokenOpen(false)} className="bg-discord-darker text-white border border-discord-dark hover:bg-discord-dark">
                              Cancel
                            </Button>
                            <Button type="submit" className="bg-discord-primary hover:bg-discord-secondary text-white" disabled={isAddingToken}>
                              {isAddingToken ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Key className="w-4 h-4 mr-2" />
                                  Add Token
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {botTokensLoading ? (
                  <div className="flex justify-center py-6">
                    <RefreshCw className="w-6 h-6 animate-spin text-discord-light" />
                  </div>
                ) : botTokens?.length === 0 ? (
                  <div className="bg-discord-darkest bg-opacity-50 rounded-lg p-6 text-center">
                    <Key className="w-8 h-8 mx-auto mb-3 text-discord-light" />
                    <h4 className="text-white font-medium mb-2">No Bot Tokens</h4>
                    <p className="text-discord-light text-sm mb-4">
                      You haven't added any Discord bot tokens yet. Add a token to get started.
                    </p>
                    <Button className="bg-discord-primary hover:bg-discord-secondary text-white mx-auto" onClick={() => setAddTokenOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Token
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {botTokens.map((token) => (
                      <div key={token.id} className="bg-discord-darkest rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            token.isActive ? "bg-discord-success" : "bg-discord-light/30"
                          )} />
                          <div>
                            <h4 className="text-white font-medium">{token.name}</h4>
                            <p className="text-discord-light text-xs">
                              Token: {token.token}
                              <span className="text-discord-lightgray ml-2 text-opacity-50">
                                • Added {formatDate(token.createdAt)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            className={cn(
                              "h-8 px-3",
                              token.isActive
                                ? "bg-discord-success hover:bg-discord-success/80 text-white cursor-not-allowed opacity-50"
                                : "bg-discord-primary hover:bg-discord-secondary text-white"
                            )}
                            onClick={() => handleActivateToken(token.id)}
                            disabled={token.isActive || isActivatingToken}
                          >
                            {token.isActive ? "Active" : "Activate"}
                          </Button>
                          <Button
                            className="h-8 px-3 bg-discord-info hover:bg-discord-info/80 text-white"
                            onClick={() => handleConnectWithToken(token.id)}
                            disabled={isConnecting || isDisconnecting}
                          >
                            Connect
                          </Button>
                          <Button
                            className="h-8 w-8 p-0 bg-discord-danger hover:bg-discord-danger/80 text-white"
                            onClick={() => handleDeleteToken(token.id)}
                            disabled={isDeletingToken}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Connect Form */}
            <Card className="bg-discord-darker shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Quick Connect</CardTitle>
                <CardDescription className="text-discord-light">
                  Connect a new bot token without saving it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...botSettingsForm}>
                  <form onSubmit={botSettingsForm.handleSubmit(onBotSettingsSubmit)} className="space-y-6">
                    <FormField
                      control={botSettingsForm.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-discord-light">Discord Bot Token</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your Discord bot token"
                              className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-discord-light text-xs">
                            Your bot token is stored securely and used to authenticate with Discord.
                            {botStatus?.lastConnectedAt && (
                              <div className="mt-2">
                                Last connected: {formatDate(botStatus.lastConnectedAt)}
                              </div>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="bg-discord-darkest bg-opacity-50 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <ShieldAlert className="w-5 h-5 mr-2 text-discord-warning" />
                        Bot Requirements
                      </h4>
                      <ul className="text-discord-light text-sm space-y-2">
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-discord-success" />
                          Bot must have the "Server Members Intent" enabled in Discord Developer Portal
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-discord-success" />
                          Bot must have permission to read server members
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-discord-success" />
                          Bot must be invited to your server with proper permissions
                        </li>
                      </ul>
                    </div>
                    
                    <Button
                      type="submit"
                      className="bg-discord-primary hover:bg-discord-secondary text-white"
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Connect Bot
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Rate Limits Tab */}
          <TabsContent value="rate-limits" className="space-y-6">
            <Card className="bg-discord-darker shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Rate Limit Settings</CardTitle>
                <CardDescription className="text-discord-light">
                  Configure messaging rate limits to comply with Discord's Terms of Service.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-discord-darkest bg-opacity-50 rounded-lg p-4 mb-6">
                  <h4 className="text-white font-medium mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-discord-warning" />
                    Discord Rate Limit Information
                  </h4>
                  <p className="text-discord-light text-sm mb-2">
                    Discord has strict rate limits for sending direct messages to prevent spam and abuse. 
                    Exceeding these limits can result in your bot being temporarily rate-limited or even banned.
                  </p>
                  <ul className="text-discord-light text-sm space-y-1">
                    <li>• Recommended: 5-10 messages per minute maximum</li>
                    <li>• Include cooldown periods between messages</li>
                    <li>• Respect user privacy settings</li>
                    <li>• Avoid sending identical messages to many users</li>
                  </ul>
                </div>
                
                <Form {...rateLimitForm}>
                  <form onSubmit={rateLimitForm.handleSubmit(onRateLimitSubmit)} className="space-y-6">
                    <FormField
                      control={rateLimitForm.control}
                      name="messagesPerMinute"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-discord-light">Messages Per Minute</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary"
                              min={1}
                              max={20}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription className="text-discord-light text-xs">
                            Maximum number of messages to send per minute (recommended: 5-10)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rateLimitForm.control}
                      name="cooldownSeconds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-discord-light">Cooldown Seconds</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary"
                              min={1}
                              max={60}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription className="text-discord-light text-xs">
                            Seconds to wait when rate limit is reached
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rateLimitForm.control}
                      name="maxQueueSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-discord-light">Maximum Queue Size</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary"
                              min={100}
                              max={20000}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription className="text-discord-light text-xs">
                            Maximum number of messages that can be queued at once
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="bg-discord-primary hover:bg-discord-secondary text-white"
                      disabled={updateRateLimitsMutation.isPending}
                    >
                      {updateRateLimitsMutation.isPending ? "Updating..." : "Save Rate Limit Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card className="bg-discord-darker shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Safe Messaging Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-discord-success mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Respect User Preferences</h4>
                      <p className="text-discord-light text-sm">Always respect users who have DMs disabled or have opted out of server messages.</p>
                    </div>
                  </div>
                  
                  <Separator className="bg-discord-darkest" />
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-discord-success mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Personalize Messages</h4>
                      <p className="text-discord-light text-sm">Use variables to personalize messages for each user instead of sending identical content.</p>
                    </div>
                  </div>
                  
                  <Separator className="bg-discord-darkest" />
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-discord-success mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Monitor Bot Status</h4>
                      <p className="text-discord-light text-sm">Regularly check the dashboard to ensure your bot is operating within Discord's limits.</p>
                    </div>
                  </div>
                  
                  <Separator className="bg-discord-darkest" />
                  
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-discord-danger mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">Avoid Spam Content</h4>
                      <p className="text-discord-light text-sm">Do not use this tool for promotional or spam content that violates Discord's Terms of Service.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
