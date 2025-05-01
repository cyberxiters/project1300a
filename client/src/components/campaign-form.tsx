import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCampaignSchema } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const formSchema = insertCampaignSchema.extend({
  templateContent: z.string().optional(),
  createNewTemplate: z.boolean().default(false),
  newTemplateName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CampaignForm() {
  const { toast } = useToast();
  const [createNewTemplate, setCreateNewTemplate] = useState(false);
  
  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates'],
  });
  
  // Fetch guilds
  const { data: guilds, isLoading: guildsLoading } = useQuery({
    queryKey: ['/api/guilds'],
  });
  
  // Fetch rate limits
  const { data: rateLimits } = useQuery({
    queryKey: ['/api/ratelimits'],
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      guildId: "",
      templateId: 0,
      targetType: "all",
      targetRoleId: "",
      rateLimit: rateLimits?.messagesPerMinute || 5,
      respectUserSettings: true,
      status: "draft",
      createNewTemplate: false,
      newTemplateName: "",
      templateContent: "",
    },
  });
  
  const createTemplateMutation = useMutation({
    mutationFn: async (data: { name: string, content: string }) => {
      const response = await apiRequest('POST', '/api/templates', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });
  
  const createCampaignMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { createNewTemplate, newTemplateName, templateContent, ...campaignData } = data;
      const response = await apiRequest('POST', '/api/campaigns', campaignData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      form.reset();
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  async function onSubmit(data: FormValues) {
    try {
      // If creating a new template, create it first
      if (data.createNewTemplate && data.newTemplateName && data.templateContent) {
        const template = await createTemplateMutation.mutateAsync({
          name: data.newTemplateName,
          content: data.templateContent,
        });
        
        // Set the new template ID
        data.templateId = template.id;
      }
      
      // Determine status based on the button clicked
      const formData = {
        ...data,
        status: form.getValues("status"),
      };
      
      // Create the campaign
      await createCampaignMutation.mutateAsync(formData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message}`,
        variant: "destructive",
      });
    }
  }
  
  function handleSaveAsDraft() {
    form.setValue("status", "draft");
    form.handleSubmit(onSubmit)();
  }
  
  function handleStartCampaign() {
    form.setValue("status", "running");
    form.handleSubmit(onSubmit)();
  }
  
  // Handle when the template selection changes
  const watchedTemplateId = form.watch("templateId");
  const selectedTemplate = templates?.find(t => t.id === parseInt(watchedTemplateId));
  
  const isLoading = templatesLoading || guildsLoading || createTemplateMutation.isPending || createCampaignMutation.isPending;

  return (
    <Card className="bg-discord-darker shadow-lg overflow-hidden">
      <CardHeader className="border-b border-discord-darkest px-6 py-4">
        <CardTitle className="text-white font-medium text-lg">Create New Campaign</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-discord-light">Campaign Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter campaign name"
                      className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="guildId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-discord-light">Select Server</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value.toString()}
                    disabled={guildsLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-discord-darkest border-discord-dark text-white focus:ring-discord-primary">
                        <SelectValue placeholder="Select a Discord server" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-discord-darkest border-discord-dark text-white">
                      {guildsLoading ? (
                        <SelectItem value="loading">Loading servers...</SelectItem>
                      ) : guilds?.length ? (
                        guilds.map(guild => (
                          <SelectItem key={guild.id} value={guild.id}>
                            {guild.name} ({guild.memberCount} members)
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none">No servers available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormField
                control={form.control}
                name="createNewTemplate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 mb-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setCreateNewTemplate(!!checked);
                        }}
                        className="data-[state=checked]:bg-discord-primary"
                      />
                    </FormControl>
                    <FormLabel className="text-discord-light cursor-pointer">
                      Create new template
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              {createNewTemplate ? (
                <>
                  <FormField
                    control={form.control}
                    name="newTemplateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-discord-light">Template Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter template name"
                            className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="templateContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-discord-light">Message Content</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your message here..."
                              className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-discord-light text-xs mt-1">
                            Available variables: @username, @servername, @channelname
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-discord-light">Message Template</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                        disabled={templatesLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-discord-darkest border-discord-dark text-white focus:ring-discord-primary">
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-discord-darkest border-discord-dark text-white">
                          {templatesLoading ? (
                            <SelectItem value="0">Loading templates...</SelectItem>
                          ) : templates?.length ? (
                            templates.map(template => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="0">No templates available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {selectedTemplate && !createNewTemplate && (
                <div className="mt-4 bg-discord-darkest rounded p-3">
                  <p className="text-discord-light text-sm">{selectedTemplate.content}</p>
                </div>
              )}
            </div>
            
            <Separator className="bg-discord-darkest" />
            
            <div>
              <h3 className="text-white text-sm font-medium mb-4">Target Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-discord-light">Target Group</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-discord-darkest border-discord-dark text-white focus:ring-discord-primary">
                            <SelectValue placeholder="Select target group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-discord-darkest border-discord-dark text-white">
                          <SelectItem value="all">All Members</SelectItem>
                          <SelectItem value="role">Specific Role</SelectItem>
                          <SelectItem value="active">Active Members</SelectItem>
                          <SelectItem value="new">New Members</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rateLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-discord-light">Rate Limit (msgs/min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary"
                          min={1}
                          max={10}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="text-discord-light text-xs">
                        Discord recommends max 5-10 messages per minute
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="respectUserSettings"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 mt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-discord-primary"
                      />
                    </FormControl>
                    <FormLabel className="text-discord-light cursor-pointer">
                      Respect user DM settings (recommended)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isLoading}
                className="border-discord-dark text-discord-light hover:bg-discord-darkest"
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={handleStartCampaign}
                disabled={isLoading}
                className="bg-discord-primary hover:bg-discord-secondary text-white"
              >
                {isLoading ? "Processing..." : "Start Campaign"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
