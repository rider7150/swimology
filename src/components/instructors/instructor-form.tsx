'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 1) Create‐vs‐Update schemas
const createInstructorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, "Password must be at least characters").optional(),
});
const updateInstructorSchema = createInstructorSchema.partial({ password: true });

type CreateFormData = z.infer<typeof createInstructorSchema>;
type UpdateFormData = z.infer<typeof updateInstructorSchema>;

type FormData = CreateFormData | UpdateFormData;

interface InstructorFormProps {
  organizationId: string;
  editingInstructor?: {
    id: string;
    userId: string;
    phoneNumber: string | null;
    user: { name: string; email: string };
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InstructorForm({
  organizationId,
  editingInstructor,
  onSuccess,
  onCancel,
}: InstructorFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 2) Pick schema and types
  const isEdit = Boolean(editingInstructor);
  const schema = isEdit ? updateInstructorSchema : createInstructorSchema;
  type SchemaType = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editingInstructor?.user.name ?? "",
      email: editingInstructor?.user.email ?? "",
      phoneNumber: editingInstructor?.phoneNumber ?? "",
      password: "",
    } as SchemaType,
  });

  // 3) Now TS knows `(data: SchemaType) => ...` lines up with RHF
  const onSubmit: SubmitHandler<SchemaType> = async (data) => {
    setError(null);
    setLoading(true);
    try {
      // Build API payload.  `data.password` exists on create; on edit it’s optional.
      const payload = { ...data } as Record<string, string>;
      if (!data.password) {
        // remove it when blank on edit
        delete payload.password;
      }

      const url = isEdit
        ? `/api/organizations/${organizationId}/instructors/${editingInstructor!.id}`
        : `/api/organizations/${organizationId}/instructors`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${isEdit ? "update" : "create"}`);
      }

      reset();
      router.refresh();
      onSuccess?.();
      if (isEdit) onCancel?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <Input id="name" {...register("name")} className="mt-1" />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input type="email" id="email" {...register("email")} className="mt-1" />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <Input type="tel" id="phoneNumber" {...register("phoneNumber")} className="mt-1" />
        {errors.phoneNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {isEdit ? "New Password (optional)" : "Password"}
        </label>
        <Input
          type="password"
          id="password"
          {...register("password" as any)}
          className="mt-1"
          placeholder={isEdit ? "Leave blank to keep current password" : ""}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {isEdit
            ? "Leave blank to keep current password"
            : "Password must be at least 6 characters long"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}