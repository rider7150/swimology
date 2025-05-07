"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationId: z.string().min(1, "Organization is required"),
  membershipId: z.string().optional(),
});

type RegistrationData = z.infer<typeof registrationSchema>;

interface Organization {
  id: string;
  name: string;
  membershipIdRequired: boolean;
}

interface ParentRegistrationFormProps {
  organizations: Organization[];
}

export function ParentRegistrationForm({ organizations }: ParentRegistrationFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
  });

  // Watch the organizationId field to update the selected organization
  const watchOrganizationId = watch("organizationId");
  
  // Update selected organization when organizationId changes
  if (watchOrganizationId !== selectedOrg?.id) {
    const org = organizations.find(org => org.id === watchOrganizationId);
    if (org !== undefined) {
      setSelectedOrg(org);
    }
  }

  const onSubmit = async (data: RegistrationData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          role: "PARENT",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to register");
      }

      // After successful registration, sign in the user
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Failed to sign in after registration");
      }

      // Redirect to parent portal after successful registration and sign in
      router.push(`/organizations/${data.organizationId}/parent-portal`);
      router.refresh(); // Refresh to update session state
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow sm:rounded-lg">
      <h2 className="text-lg font-medium text-gray-900">Parent Registration</h2>
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
            Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="name"
              {...register("name")}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <div className="mt-1">
            <input
              type="email"
              id="email"
              {...register("email")}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              type="password"
              id="password"
              {...register("password")}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="organizationId"
            className="block text-sm font-medium text-gray-700"
          >
            Organization
          </label>
          <div className="mt-1">
            <select
              id="organizationId"
              {...register("organizationId")}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="">Select an organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {errors.organizationId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.organizationId.message}
              </p>
            )}
          </div>
        </div>

        {selectedOrg?.membershipIdRequired && (
          <div>
            <label
              htmlFor="membershipId"
              className="block text-sm font-medium text-gray-700"
            >
              Membership ID
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="membershipId"
                {...register("membershipId")}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
              {errors.membershipId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.membershipId.message}
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      </form>
    </div>
  );
} 