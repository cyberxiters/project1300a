import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

// Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Form Schemas
const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

const registerSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  const isMobile = useIsMobile();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (values: LoginValues) => {
    try {
      await loginMutation.mutateAsync(values);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate("/");
    } catch (error) {
      // Error handling is done in the mutation via the useAuth hook
    }
  };

  const onRegisterSubmit = async (values: RegisterValues) => {
    try {
      const { confirmPassword, ...registerData } = values;
      await registerMutation.mutateAsync(registerData);
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });
      navigate("/");
    } catch (error) {
      // Error handling is done in the mutation via the useAuth hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
        {/* Auth Forms */}
        <div className="flex flex-col justify-center">
          {/* Mobile App Title - Only visible on mobile */}
          {isMobile && (
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-primary mb-2">
                Cyber Artist X
              </h1>
              <p className="text-sm text-foreground/70">
                Advanced AI Messaging Platform
              </p>
            </div>
          )}
          
          <Tabs 
            defaultValue="login" 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader className={isMobile ? "px-4 py-4" : ""}>
                  <CardTitle className={isMobile ? "text-lg" : ""}>Login to your account</CardTitle>
                  <CardDescription className={isMobile ? "text-sm" : ""}>
                    Enter your credentials to access Cyber Artist X
                  </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? "px-4 pb-2" : ""}>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3 md:space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className={`flex justify-center ${isMobile ? "px-4 py-3" : ""}`}>
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab("register")}
                    >
                      Register here
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader className={isMobile ? "px-4 py-4" : ""}>
                  <CardTitle className={isMobile ? "text-lg" : ""}>Create an account</CardTitle>
                  <CardDescription className={isMobile ? "text-sm" : ""}>
                    Register to access Cyber Artist X platform
                  </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? "px-4 pb-2" : ""}>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3 md:space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a strong password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className={`flex justify-center ${isMobile ? "px-4 py-3" : ""}`}>
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab("login")}
                    >
                      Login here
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Mobile Features Section - Mini version for mobile */}
          {isMobile && (
            <div className="mt-6 space-y-2 text-center">
              <p className="text-sm font-medium text-foreground/90">Key Features:</p>
              <div className="flex justify-center space-x-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Hero Section - Desktop only */}
        <div className="hidden md:flex flex-col justify-center">
          <div className="p-6 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-4">
              Cyber Artist X
            </h1>
            <p className="text-xl text-foreground/80 mb-6">
              Advanced messaging platform for creative digital communication across channels.
            </p>
            <div className="space-y-4 text-foreground/70">
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Smart Pacing</h3>
                  <p>Intelligent message delivery with advanced rate limiting</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Enhanced</h3>
                  <p>Cutting-edge AI technology for optimal communication</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Secure Access</h3>
                  <p>Protected with authentication and security features</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}