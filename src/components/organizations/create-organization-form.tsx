"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function CreateOrganizationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      membershipIdRequired: false,
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
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
  };

  return (
    <div className="bg-white p-6 shadow sm:rounded-lg">
      <h2 className="text-lg font-medium text-gray-900">Create Organization</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
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
          <div className="mt-1">
            <input
              type="text"
              id="name"
              {...register("name")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="membershipIdRequired"
            {...register("membershipIdRequired")}
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
          <div className="mt-1">
            <input
              type="text"
              id="adminName"
              {...register("adminName")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            />
            {errors.adminName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.adminName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="adminEmail"
            className="block text-sm font-medium text-gray-700"
          >
            Admin Email
          </label>
          <div className="mt-1">
            <input
              type="email"
              id="adminEmail"
              {...register("adminEmail")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            />
            {errors.adminEmail && (
              <p className="mt-1 text-sm text-red-600">
                {errors.adminEmail.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="adminPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Admin Password
          </label>
          <div className="mt-1">
            <input
              type="password"
              id="adminPassword"
              {...register("adminPassword")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            />
            {errors.adminPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.adminPassword.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Organization"}
          </button>
        </div>
      </form>
    </div>
  );
} 