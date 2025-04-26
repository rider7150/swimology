"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";

interface Lesson {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  instructor: {
    user: {
      name: string;
    };
  };
  classLevel: {
    name: string;
  };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const addChildSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  lessonId: z.string().min(1, "Please select a lesson"),
});

type AddChildData = z.infer<typeof addChildSchema>;

interface AddChildFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddChildForm({ onSuccess, onCancel }: AddChildFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddChildData>({
    resolver: zodResolver(addChildSchema),
  });

  useEffect(() => {
    async function fetchLessons() {
      try {
        const response = await fetch("/api/lessons");
        if (!response.ok) {
          throw new Error("Failed to fetch lessons");
        }
        const data = await response.json();
        console.log("Fetched lessons:", data);
        setLessons(data);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      }
    }

    fetchLessons();
  }, []);

  const onSubmit = async (data: AddChildData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch("/api/children", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add child");
      }

      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add child");
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    // If time is in HH:mm format
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    // If time is an ISO string or Date string
    const date = new Date(time);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return time;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onCancel}
        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Add a Child
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please provide your child&apos;s information.
          </p>
        </div>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="name"
              {...register("name")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm h-10"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
            Birth Date
          </label>
          <div className="mt-1">
            <input
              type="date"
              id="birthDate"
              {...register("birthDate")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm h-10"
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="lessonId" className="block text-sm font-medium text-gray-700">
            Lesson
          </label>
          <div className="mt-1">
            <select
              id="lessonId"
              {...register("lessonId")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm h-10"
            >
              <option value="">Select a lesson</option>
              {lessons.map((lesson) => {
                const dayOfWeek = getDayName(lesson.dayOfWeek) + 's';
                const startTime = formatTime(lesson.startTime);
                const endTime = formatTime(lesson.endTime);
                return (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.classLevel.name}, {dayOfWeek}, {startTime} - {endTime}, with {lesson.instructor.user.name}
                  </option>
                );
              })}
            </select>
            {errors.lessonId && (
              <p className="mt-1 text-sm text-red-600">{errors.lessonId.message}</p>
            )}
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
          >
            {loading ? "Adding..." : "Add Child"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 