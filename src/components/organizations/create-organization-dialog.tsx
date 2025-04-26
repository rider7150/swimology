'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  membershipIdRequired: z.boolean().default(false),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export function CreateOrganizationDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      membershipIdRequired: false,
    },
  });

  async function onSubmit(data: OrganizationFormData) {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          membershipIdRequired: data.membershipIdRequired,
          admin: {
            name: data.adminName,
            email: data.adminEmail,
            password: data.adminPassword,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create organization");
      }

      toast.success("Organization created successfully");
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to create organization. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-5 w-5 mr-2" />
          Add Organization
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Create New Organization
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Organization Name
              </label>
              <Input
                id="name"
                {...form.register("name")}
                className="mt-1"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="membershipIdRequired"
                {...form.register("membershipIdRequired")}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="membershipIdRequired"
                className="ml-2 block text-sm text-gray-900"
              >
                Require membership ID for parent registration
              </label>
            </div>

            <div>
              <label
                htmlFor="adminName"
                className="block text-sm font-medium text-gray-700"
              >
                Admin Name
              </label>
              <Input
                id="adminName"
                {...form.register("adminName")}
                className="mt-1"
              />
              {form.formState.errors.adminName && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.adminName.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="adminEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Admin Email
              </label>
              <Input
                id="adminEmail"
                type="email"
                {...form.register("adminEmail")}
                className="mt-1"
              />
              {form.formState.errors.adminEmail && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.adminEmail.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="adminPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Admin Password
              </label>
              <Input
                id="adminPassword"
                type="password"
                {...form.register("adminPassword")}
                className="mt-1"
              />
              {form.formState.errors.adminPassword && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.adminPassword.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Creating..." : "Create Organization"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 