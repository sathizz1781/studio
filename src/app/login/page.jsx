
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
import {
  Loader2,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

/* -------------------- Schemas -------------------- */

const entityLoginSchema = z.object({
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().optional(),
});

const developerLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

/* -------------------- Reusable Form -------------------- */

const LoginForm = ({
  schema,
  onLogin,
  fields,
  isSubmitting,
  buttonText,
}) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce(
      (acc, field) => ({ ...acc, [field.name]: "" }),
      {}
    ),
  });

  const onSubmit = (data) => {
    onLogin(data, toast);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field) => {
          const isPassword = field.type === "password";

          return (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...formField}
                        type={
                          isPassword
                            ? showPassword
                              ? "text"
                              : "password"
                            : field.type
                        }
                        placeholder={field.placeholder}
                        disabled={isSubmitting}
                        className={isPassword ? "pr-10" : ""}
                      />

                      {/* 👁 Password Viewer */}
                      {isPassword && (
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}

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

/* -------------------- Main Page -------------------- */

export default function LoginPage() {
  const { login } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  /* -------- Entity Login -------- */

  const handleEntityLogin = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        "https://bend-mqjz.onrender.com/api/config/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: data.mobileNumber,
            password: data.password,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Authentication failed");
      }

      await login("entity", { mobileNumber: data.mobileNumber });

      toast({
        title: "Login successful",
        description: result.message || "Welcome!",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------- Developer Login -------- */

  const handleDeveloperLogin = async (data) => {
    setIsSubmitting(true);

    if (data.username === "developer" && data.password === "devpassword") {
      toast({
        title: "Developer Login Successful",
        description: "Welcome, developer!",
      });
      await login("developer", {});
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid developer credentials",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Tabs defaultValue="entity" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entity">Weibridge Login</TabsTrigger>
          <TabsTrigger value="developer">Developer Login</TabsTrigger>
        </TabsList>

        {/* -------- Entity Tab -------- */}
        <TabsContent value="entity">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Weibridge Login</CardTitle>
              <CardDescription>
                Password required only for existing users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm
                schema={entityLoginSchema}
                onLogin={handleEntityLogin}
                isSubmitting={isSubmitting}
                buttonText="Login as Weibridge User"
                fields={[
                  {
                    name: "mobileNumber",
                    label: "Mobile Number",
                    type: "tel",
                    placeholder: "9876543210",
                  },
                  {
                    name: "password",
                    label: "Password",
                    type: "password",
                    placeholder: "••••••••",
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------- Developer Tab -------- */}
        <TabsContent value="developer">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Developer Login</CardTitle>
              <CardDescription>
                Enter developer credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm
                schema={developerLoginSchema}
                onLogin={handleDeveloperLogin}
                isSubmitting={isSubmitting}
                buttonText="Login as Developer"
                fields={[
                  {
                    name: "username",
                    label: "Username",
                    type: "text",
                    placeholder: "developer",
                  },
                  {
                    name: "password",
                    label: "Password",
                    type: "password",
                    placeholder: "••••••••",
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
