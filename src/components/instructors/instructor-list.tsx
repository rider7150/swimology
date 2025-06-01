'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PlusIcon, PencilIcon, TrashIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { EditInstructorDialog } from "./edit-instructor-dialog";
import { AddInstructorDialog } from "./add-instructor-dialog";
import { EditLessonDialog } from "@/components/lessons/edit-lesson-dialog";
import { AddLessonDialog } from "@/components/lessons/add-lesson-dialog";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface ClassLevel {
  id: string;
  name: string;
}

interface Lesson {
  id: string;
  classLevelId: string;
  month: number;      // restored
  year: number;       // restored
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  classLevel: { id: string; name: string };
}

interface Instructor {
  id: string;
  organizationId: string;
  userId: string;                // required by EditInstructorDialog
  phoneNumber: string | null;
  user: User;
  lessons: Lesson[];
}

interface InstructorListProps {
  organizationId: string;
  instructors: Instructor[];
  classLevels: ClassLevel[];
}

const days = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday"
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatTime(t: string) {
    let date: Date;
    // if it looks like a full ISO string, parse directly…
    if (t.includes("T")) {
      date = new Date(t);
    } else {
      // otherwise assume it's just "HH:mm" or "HH:mm:ss"
      date = new Date(`2000-01-01T${t}`);
    }
    if (isNaN(date.getTime())) {
      // fallback to raw text if we still can't parse
      return t;
    }
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

export function InstructorList({
  organizationId,
  instructors: initialInstructors,
  classLevels,
}: InstructorListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState(initialInstructors);
  const [cloneLesson, setCloneLesson] = useState<Lesson | null>(null);
  // Filter state
  const now = new Date();
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()));
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth() + 1));

  // Update local state when props change
  useEffect(() => {
    setInstructors(initialInstructors);
    // If there's a selected instructor, update its data
    if (selected) {
      const updatedInstructor = initialInstructors.find(i => i.id === selected.id);
      if (updatedInstructor) {
        setSelected(updatedInstructor);
      }
    }
  }, [initialInstructors, selected?.id]);

  async function handleDeleteInstructor(id: string) {
    setLoading(true);
    await fetch(`/api/organizations/${organizationId}/instructors/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  async function handleDeleteLesson(id: string) {
    setLoading(true);
    await fetch(`/api/organizations/${organizationId}/lessons/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  // Function to refresh instructors data
  const refreshInstructors = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/instructors`);
      if (response.ok) {
        const data = await response.json();
        setInstructors(data);
        // If there's a selected instructor, update its data
        if (selected) {
          const updatedInstructor = data.find((i: Instructor) => i.id === selected.id);
          if (updatedInstructor) {
            setSelected(updatedInstructor);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing instructors:', error);
    }
  };

  // Get all years and months from lessons for filter dropdowns
  const allLessons = selected ? selected.lessons : [];
  const uniqueYears = Array.from(new Set(allLessons.map(l => l.year))).sort();
  const uniqueMonths = Array.from(new Set(allLessons.map(l => l.month))).sort((a, b) => a - b);

  // Filter and sort lessons
  let filteredLessons = allLessons;
  if (filterYear) filteredLessons = filteredLessons.filter(l => l.year === Number(filterYear));
  if (filterMonth) filteredLessons = filteredLessons.filter(l => l.month === Number(filterMonth));
  filteredLessons = filteredLessons.slice().sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    // Compare startTime as time strings (HH:mm)
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex justify-end space-x-4">
        {/* Renders its own "Add Instructor" button */}
        <AddInstructorDialog organizationId={organizationId} />
      </div>

      {/* Instructor Grid */}
      {instructors.length === 0 ? (
        <p className="text-sm text-gray-500">No instructors added yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((inst) => (
          <div
            key={inst.id}
            className={cn(
              "bg-white p-6 rounded-lg shadow flex flex-col justify-between transition",
              selected?.id === inst.id
                ? "ring-2 ring-indigo-500"
                : "hover:shadow-lg"
            )}
          >
            {/* only this header toggles */}
            <div
              onClick={() =>
                setSelected(prev => (prev?.id === inst.id ? null : inst))
              }
              className="flex justify-between items-center cursor-pointer"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {inst.user.name ?? "Unnamed"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {inst.user.email}
                </p>
                {inst.phoneNumber && (
                  <p className="mt-1 text-sm text-gray-500">
                    {inst.phoneNumber}
                  </p>
                )}
              </div>
              <span className="text-sm font-medium text-indigo-600">
                {inst.lessons.length} lesson
                {inst.lessons.length !== 1 && "s"}
              </span>
            </div>
            {/* actions live here; clicks won't bubble up */}
            <div className="mt-4 flex space-x-2">
            <EditInstructorDialog
              organizationId={organizationId}
              instructor={{
                id: inst.id,
                userId: inst.userId,
                phoneNumber: inst.phoneNumber,
                user: {
                name: inst.user.name ?? "Unnamed",
                email: inst.user.email,
                },
              }}
            />
              <DeleteConfirmationDialog
                onDelete={() => handleDeleteInstructor(inst.id)}
                isDeleting={loading}
                itemType="instructor"
                itemName={inst.user.name ?? "Unnamed"}
              />
            </div>
          </div>
          ))}
        </div>
      )}

        {/* Once you've drilled in, show lessons + "Add Lesson" in its own header */}
        {selected && (
          <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Lessons for {selected.user.name}
              </h2>
              <AddLessonDialog
                organizationId={organizationId}
                classLevels={classLevels}
                instructors={instructors.map(i => ({
                  id: i.id,
                  user: { name: i.user.name ?? 'Unnamed', email: i.user.email }
                }))}
                onSuccess={refreshInstructors}
              />
            </div>
            {/* Filter controls */}
            <div className="flex gap-4 px-6 pt-2 pb-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Year</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                >
                  <option value="">All</option>
                  {uniqueYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Month</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                >
                  <option value="">All</option>
                  {uniqueMonths.map(m => (
                    <option key={m} value={m}>{months[m - 1]}</option>
                  ))}
                </select>
              </div>
            </div>
            <table className="w-full table-auto divide-y divide-gray-200 mt-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Lesson
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Day &amp; Time
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lesson.classLevel.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {months[lesson.month - 1]} {lesson.year}, {days[lesson.dayOfWeek]} at {formatTime(lesson.startTime)}–{formatTime(lesson.endTime)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm flex justify-end space-x-2">
                      <EditLessonDialog
                        organizationId={organizationId}
                        classLevels={classLevels}
                        instructors={instructors.map((i) => ({
                          id: i.id,
                          user: { name: i.user.name ?? "Unnamed", email: i.user.email },
                        }))}
                        lesson={{
                          id: lesson.id,
                          classLevelId: lesson.classLevelId,
                          instructorId: selected.id,
                          month: lesson.month,
                          year: lesson.year,
                          dayOfWeek: lesson.dayOfWeek,
                          startTime: lesson.startTime,
                          endTime: lesson.endTime,
                        }}
                        onSuccess={refreshInstructors}
                      />
                      {/* Clone Button */}
                      <button
                        type="button"
                        className="p-2 rounded text-indigo-400 hover:text-indigo-600"
                        title="Clone Lesson"
                        onClick={() => setCloneLesson(lesson)}
                      >
                        <DocumentDuplicateIcon className="h-5 w-5" />
                      </button>
                      <DeleteConfirmationDialog
                        onDelete={async () => {
                          await handleDeleteLesson(lesson.id);
                          refreshInstructors();
                        }}
                        isDeleting={loading}
                        itemType="lesson"
                        itemName={selected.user.name ?? "Lesson"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Clone Lesson Dialog */}
            {cloneLesson && (
              <AddLessonDialog
                organizationId={organizationId}
                classLevels={classLevels}
                instructors={instructors.map(i => ({
                  id: i.id,
                  user: { name: i.user.name ?? 'Unnamed', email: i.user.email }
                }))}
                onSuccess={() => {
                  setCloneLesson(null);
                  refreshInstructors();
                }}
                initialData={{
                  classLevelId: cloneLesson.classLevelId,
                  instructorId: selected.id,
                  month: cloneLesson.month,
                  year: cloneLesson.year,
                  dayOfWeek: cloneLesson.dayOfWeek,
                  startTime: cloneLesson.startTime,
                  endTime: cloneLesson.endTime,
                }}
                open={!!cloneLesson}
                onOpenChange={(open) => {
                  if (!open) setCloneLesson(null);
                }}
              />
            )}
          </div>
        )}
    </div>
  );
}