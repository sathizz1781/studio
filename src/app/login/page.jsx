
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppContext } from "@/app/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const entityLoginSchema = z.object({
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(1, "Password is required"),
});

const developerLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const LoginForm = ({ schema, onLogin, fields, isSubmitting, buttonText }) => {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce((acc, field) => ({ ...acc, [field.name]: "" }), {}),
  });

  const onSubmit = (data) => {
    onLogin(data, toast);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input type={field.type} placeholder={field.placeholder} {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          {buttonText}
        </Button>
      </form>
    </Form>
  );
};

export default function LoginPage() {
  const { login, entities } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEntityLogin = (data, toast) => {
    setIsSubmitting(true);
    
    const entity = entities.find(
      (e) => e.mobileNumber === data.mobileNumber && e.password === data.password
    );

    if (entity) {
      if (entity.isBlocked) {
        toast({
          variant: "destructive",
          title: "Account Blocked",
          description: "Your account has been blocked. Please contact support.",
        });
      } else {
         toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        login('entity', { id: entity.id, companyName: entity.companyName, mobileNumber: entity.mobileNumber });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid mobile number or password.",
      });
    }
    setIsSubmitting(false);
  };
  
  const handleDeveloperLogin = (data, toast) => {
    setIsSubmitting(true);
    // Hardcoded credentials for founder/developer
    if (data.username === "developer" && data.password === "devpassword") {
      toast({
        title: "Developer Login Successful",
        description: "Welcome, developer!",
      });
      login('developer');
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid developer credentials.",
      });
    }
    setIsSubmitting(false);
  };


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Tabs defaultValue="entity" className="w-full max-w-sm">
         <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entity">Entity Login</TabsTrigger>
          <TabsTrigger value="developer">Developer Login</TabsTrigger>
        </TabsList>
        <TabsContent value="entity">
            <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Entity Login</CardTitle>
                  <CardDescription>
                    Enter your mobile number and password to access your weighbridge.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm
                        schema={entityLoginSchema}
                        onLogin={handleEntityLogin}
                        fields={[
                            { name: "mobileNumber", label: "Mobile Number", type: "tel", placeholder: "9876543210" },
                            { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
                        ]}
                        isSubmitting={isSubmitting}
                        buttonText="Login as Entity"
                    />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="developer">
             <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Developer Login</CardTitle>
                  <CardDescription>
                    Enter developer credentials for full access.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm
                        schema={developerLoginSchema}
                        onLogin={handleDeveloperLogin}
                        fields={[
                            { name: "username", label: "Username", type: "text", placeholder: "developer" },
                            { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
                        ]}
                        isSubmitting={isSubmitting}
                        buttonText="Login as Developer"
                    />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    