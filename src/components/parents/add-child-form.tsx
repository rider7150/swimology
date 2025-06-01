'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Lesson {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  instructor: { user: { name: string } };
  classLevel: { name: string };
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
  onSuccess: (childName: string, instructorName: string) => void;
  onCancel: () => void;
}

export function AddChildForm({ onSuccess, onCancel }: AddChildFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [filteredByDayLessons, setFilteredByDayLessons] = useState<Lesson[]>([]);
  const [startDate, setStartDate] = useState(new Date());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<AddChildData>({
    resolver: zodResolver(addChildSchema),
    mode: "onChange",          // track validity as user types
  });

  // Watch the lessonId field
  const lessonId = watch("lessonId");


  // Fetch lessons & instructors
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/lessons");
      if (!res.ok) return;
      const data: Lesson[] = await res.json();
      const thisMonth = startOfMonth(new Date());
      const upcoming = data.filter(l => new Date(l.startDate) >= thisMonth);
      setLessons(upcoming);
      const unique = Array.from(
        new Map(
          upcoming.map(l => [
            l.instructor.user.name,
            { id: l.instructor.user.name, name: l.instructor.user.name },
          ])
        ).values()
      );
      setInstructors(unique);
    }
    load();
  }, []);

  // Filter lessons by instructor
  useEffect(() => {
    if (selectedInstructor) {
      setFilteredLessons(
        lessons.filter(l => l.instructor.user.name === selectedInstructor)
      );
    } else {
      setFilteredLessons([]);
    }
    setValue("lessonId", "");
    setSelectedDay("");
    setFilteredByDayLessons([]);
  }, [selectedInstructor, lessons, setValue]);

  // Filter by day of week
  useEffect(() => {
    if (selectedDay) {
      setFilteredByDayLessons(
        filteredLessons.filter(l => getDayName(l.dayOfWeek) === selectedDay)
      );
    } else {
      setFilteredByDayLessons([]);
    }
    setValue("lessonId", "");
  }, [selectedDay, filteredLessons, setValue]);

  const onSubmit = async (data: AddChildData) => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add child");
      }
      // Find instructor name from selected lesson
      let instructorName = "";
      const lesson = lessons.find(l => l.id === data.lessonId);
      if (lesson) {
        instructorName = lesson.instructor.user.name;
      }
      onSuccess(data.name, instructorName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (d: number) =>
    ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d];

  const formatTime = (t: string) => {
    if (/^(\d|1\d|2[0-3]):[0-5]\d$/.test(t)) {
      const [h, m] = t.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m);
      return d.toLocaleTimeString("en-US",{ hour:"numeric", minute:"2-digit" });
    }
    const d = new Date(t);
    return isNaN(d.getTime())
      ? t
      : d.toLocaleTimeString("en-US",{ hour:"numeric", minute:"2-digit" });
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent onPointerDownOutside={onCancel}>
        <DialogTitle>Add a Child</DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              {...register("name")}
              className="mt-1 block w-full border rounded p-2"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Birth Date */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
              Birth Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => {
                if (date) {
                  setStartDate(date);
                  setValue("birthDate", format(date, "MM/dd/yyyy")); // Set birthDate value
                }
              }}
              dateFormat="MM/dd/yyyy"
              className="block w-full border rounded p-2"
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
            )}
          </div>

          {/* Instructor */}
          <div>
            <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">
              Instructor
            </label>
            <select
              id="instructor"
              value={selectedInstructor}
              onChange={e => setSelectedInstructor(e.target.value)}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Select an instructor</option>
              {instructors.map(i => (
                <option key={i.id} value={i.name}>{i.name}</option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          {selectedInstructor && (
            <div>
              <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                Day of the Week
              </label>
              <select
                id="dayOfWeek"
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
              >
                <option value="">Select a day</option>
                {[...new Set(filteredLessons.map(l => getDayName(l.dayOfWeek)))].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          )}

          {/* Lesson */}
          {selectedDay && (
            <div>
              <label htmlFor="lessonId" className="block text-sm font-medium text-gray-700">
                Lesson
              </label>
              <select
                id="lessonId"
                {...register("lessonId")}
                onChange={(e) => {
                  setValue("lessonId", e.target.value); // This will trigger validation
                }}
                className="mt-1 block w-full border rounded p-2"
              >
                <option value="">Select a lesson</option>
                {filteredByDayLessons.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.classLevel.name}, {format(new Date(l.startDate),'MMMM')}, {formatTime(l.startTime)} – {formatTime(l.endTime)}
                  </option>
                ))}
              </select>
              {errors.lessonId && (
                <p className="mt-1 text-sm text-red-600">{errors.lessonId.message}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !lessonId}
              className="px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Child"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}