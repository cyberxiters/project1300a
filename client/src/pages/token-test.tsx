import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function TokenTest() {
  const { toast } = useToast();
  const [testTokenResult, setTestTokenResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async (testName: string, endpoint: string, method: string, body?: any) => {
    setIsLoading(true);
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(endpoint, options);
      const result = await response.json();
      
      setTestTokenResult(JSON.stringify(result, null, 2));
      
      toast({
        title: `Test ${testName} completed`,
        description: `Status: ${response.status}`,
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      setTestTokenResult(`Error: ${errorMessage}`);
      toast({
        title: `Test ${testName} failed`,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // The different test operations
  const addToken = () => {
    runTest(
      "Add Token", 
      "/api/bot/tokens",
      "POST",
      {
        name: "Test Token " + Date.now(),
        token: "TestToken." + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + "." + Math.random().toString(36).substring(2, 15),
        isActive: false
      }
    );
  };

  const getTokens = () => {
    runTest("Get Tokens", "/api/bot/tokens", "GET");
  };

  const getBotSettings = () => {
    runTest("Get Bot Settings", "/api/bot/settings", "GET");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Token API Testing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={getTokens} 
                disabled={isLoading}
                variant="outline"
              >
                Get All Tokens
              </Button>
              
              <Button 
                onClick={addToken} 
                disabled={isLoading}
                variant="default"
              >
                Add Test Token
              </Button>
              
              <Button 
                onClick={getBotSettings} 
                disabled={isLoading}
                variant="outline"
              >
                Get Bot Settings
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-800 p-4 rounded text-white overflow-auto max-h-96">
              {testTokenResult || "No results yet. Run a test."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}