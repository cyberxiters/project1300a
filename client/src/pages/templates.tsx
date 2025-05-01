import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { Plus, Edit, Trash2, Copy, FileEdit } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { insertMessageTemplateSchema, MessageTemplate } from "@shared/schema";

const templateFormSchema = insertMessageTemplateSchema;
type TemplateFormValues = z.infer<typeof templateFormSchema>;

export default function Templates() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/templates'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Create template form
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      content: ""
    }
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const response = await apiRequest('POST', '/api/templates', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template created",
        description: "Your message template has been created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: TemplateFormValues }) => {
      const response = await apiRequest('PATCH', `/api/templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template updated",
        description: "Your message template has been updated successfully",
      });
      setEditingTemplate(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template deleted",
        description: "The message template has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Form submission handlers
  const onSubmitCreate = (data: TemplateFormValues) => {
    createTemplateMutation.mutate(data);
  };

  const onSubmitEdit = (data: TemplateFormValues) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    }
  };

  const handleDelete = (id: number) => {
    deleteTemplateMutation.mutate(id);
  };

  const handleOpenEditDialog = (template: MessageTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      content: template.content
    });
  };

  const handleDuplicateTemplate = (template: MessageTemplate) => {
    form.reset({
      name: `Copy of ${template.name}`,
      content: template.content
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-discord-darker border-b border-discord-darkest py-4 px-6 flex items-center justify-between">
        <h2 className="text-white text-xl font-medium">Message Templates</h2>
        <div className="flex items-center space-x-4">
          <Button 
            className="bg-discord-primary hover:bg-discord-secondary text-white rounded-md flex items-center"
            onClick={() => {
              form.reset({ name: "", content: "" });
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Template
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-discord p-6 bg-discord-dark">
        {isLoading ? (
          <div className="text-discord-light text-center py-10">
            Loading templates...
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template: MessageTemplate) => (
              <Card key={template.id} className="bg-discord-darker shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="border-b border-discord-darkest px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white font-medium text-lg">{template.name}</CardTitle>
                      <p className="text-discord-light text-xs mt-1">Created {formatDate(template.createdAt)}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(template)} className="h-8 w-8">
                        <Edit className="h-4 w-4 text-discord-light hover:text-white" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicateTemplate(template)} className="h-8 w-8">
                        <Copy className="h-4 w-4 text-discord-light hover:text-white" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-discord-light hover:text-discord-danger" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-discord-darker border-discord-darkest">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Template</AlertDialogTitle>
                            <AlertDialogDescription className="text-discord-light">
                              Are you sure you want to delete this template? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-discord-darkest text-discord-light border-none hover:bg-discord-dark hover:text-white">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-discord-danger hover:bg-discord-danger/80 text-white"
                              onClick={() => handleDelete(template.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div 
                    className="bg-discord-darkest rounded-md p-4 text-discord-light text-sm h-32 overflow-y-auto scrollbar-discord"
                  >
                    {template.content}
                  </div>
                </CardContent>
                <CardFooter className="px-6 py-4 bg-discord-darkest bg-opacity-50 flex justify-between">
                  <div className="flex items-center">
                    <Badge className="bg-discord-primary bg-opacity-10 text-discord-primary">
                      Template
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-discord-dark text-discord-light hover:bg-discord-darkest"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    Preview
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-discord-darker rounded-lg shadow-lg p-10 text-center">
            <FileEdit className="h-16 w-16 text-discord-primary mx-auto mb-4" />
            <h3 className="text-white text-xl font-medium mb-2">No Templates Yet</h3>
            <p className="text-discord-light mb-6">
              Create your first message template to get started with campaigns.
            </p>
            <Button 
              className="bg-discord-primary hover:bg-discord-secondary text-white"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create Template
            </Button>
          </div>
        )}
      </main>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-discord-darker border-discord-darkest sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Template</DialogTitle>
            <DialogDescription className="text-discord-light">
              Create a message template that you can use in your campaigns.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-discord-light">Template Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Welcome Message"
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
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-discord-light">Message Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Hey @username, welcome to our Discord server!"
                        className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-discord-light text-xs mt-1">
                      Available variables: @username, @servername, @channelname
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-discord-dark text-discord-light hover:bg-discord-darkest"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-discord-primary hover:bg-discord-secondary text-white"
                  disabled={createTemplateMutation.isPending}
                >
                  {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="bg-discord-darker border-discord-darkest sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Template</DialogTitle>
            <DialogDescription className="text-discord-light">
              Update your message template details.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-discord-light">Template Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Welcome Message"
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
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-discord-light">Message Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Hey @username, welcome to our Discord server!"
                        className="bg-discord-darkest border-discord-dark text-white focus-visible:ring-discord-primary min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-discord-light text-xs mt-1">
                      Available variables: @username, @servername, @channelname
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingTemplate(null)}
                  className="border-discord-dark text-discord-light hover:bg-discord-darkest"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-discord-primary hover:bg-discord-secondary text-white"
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="bg-discord-darker border-discord-darkest">
          <DialogHeader>
            <DialogTitle className="text-white">Preview Template</DialogTitle>
            <DialogDescription className="text-discord-light">
              This is how your message will appear to recipients.
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <>
              <div className="bg-discord-dark rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-discord-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                    B
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-white">DM Bot</span>
                      <span className="text-discord-light text-xs ml-2">Today at {new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="mt-1 text-discord-light">
                      {previewTemplate.content
                        .replace(/@username/g, "JohnDoe")
                        .replace(/@servername/g, "Awesome Discord Server")
                        .replace(/@channelname/g, "general")}
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  onClick={() => setPreviewTemplate(null)}
                  className="bg-discord-primary hover:bg-discord-secondary text-white"
                >
                  Close Preview
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
