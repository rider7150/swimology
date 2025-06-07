'use client';

import { useState, useEffect, useRef } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { AddChildForm } from "@/components/parents/add-child-form";
import {
  CheckCircle,
  Clock,
  MoreHorizontal,
  GraduationCap,
  ArrowRightCircle,
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { DeleteConfirmationDialog } from "@/components/instructors/delete-confirmation-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Skill {
  id: string;
  name: string;
  description?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  strengthNotes?: string;
  improvementNotes?: string;
  notes?: string;
}

interface ClassLevel {
  id?: string;
  name: string;
  color?: string;
}

interface Lesson {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  instructor?: { id: string; user?: { name: string } };
  classLevel: ClassLevel;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  progress?: number;
  skills?: Skill[];
  readyForNextLevel?: boolean;
  strengthNotes?: string;
  improvementNotes?: string;
  enrollmentId: string;
}

interface Child {
  id: string;
  name: string;
  lessons: Lesson[];
  birthDate?: string;
}

interface ParentDashboardProps {
  children: Child[];
}

export default function ParentDashboard({ children: initialChildren }: ParentDashboardProps) {
  // Main data
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Next-lesson selector state
  const [showNextLessonModal, setShowNextLessonModal] = useState(false);
  const [nextLessonOptions, setNextLessonOptions] = useState<Lesson[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number | "">("");
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [selectedNextLesson, setSelectedNextLesson] = useState<Lesson | null>(null);
  const [nextLevelName, setNextLevelName] = useState<string>("");
  const [nextLevelColor, setNextLevelColor] = useState<string>("");

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Add filter state for Active/All
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [lessonFilter, setLessonFilter] = useState<'active' | 'all'>('active');

  // Add success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Fetch & refresh children every 30s
  const refreshChildren = async () => {
    try {
      const res = await fetch("/api/children");
      if (!res.ok) throw new Error("Failed to fetch children");
      setChildren(await res.json());
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    refreshChildren();
    const iv = setInterval(refreshChildren, 30000);
    return () => clearInterval(iv);
  }, []);

    // Fetch next level name when a student is selected
    useEffect(() => {
      const fetchNextLevel = async () => {
        if (selectedChild?.lessons[0]?.classLevel?.id) {
          try {
            const response = await fetch(`/api/class-levels/next/${selectedChild.lessons[0].classLevel.id}`);
            if (response.ok) {
              const data = await response.json();
              setNextLevelName(data.name);
              setNextLevelColor(data.color);
            }
          } catch (error) {
            console.error('Error fetching next level:', error);
          }
        }
      };
      fetchNextLevel();
    }, [selectedChild]);

  // Formatting helpers
  const formatTime = (t: string | Date) => {
    try {
      const date = typeof t === "string" ? new Date(t) : t;
      if (isNaN(date.getTime())) return "Invalid time";
      return format(date, "h:mm a");
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "MMMM yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const getDayName = (d: number) =>
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d] || "Unknown day";

  const getStatusColor = (s: Skill["status"]) =>
    s === "COMPLETED"
      ? "bg-green-100 hover:bg-green-200 text-green-600"
      : s === "IN_PROGRESS"
      ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-600"
      : "bg-blue-100 hover:bg-blue-200 text-blue-600";
  const getStatusIcon = (s: Skill["status"]) =>
    s === "COMPLETED" ? (
      <CheckCircle className="h-8 w-8" />
    ) : s === "IN_PROGRESS" ? (
      <Clock className="h-8 w-8" />
    ) : (
      <MoreHorizontal className="h-8 w-8" />
    );

  // Open dialog & load lessons
  const openNextLessonModal = async (child: Child, lesson: Lesson) => {
    setSelectedChild(child);
    setSelectedLesson(lesson);
    setSelectedInstructorId("");
    setSelectedDay("");
    setFilteredLessons([]);
    setSelectedNextLesson(null);
    try {
      const res = await fetch("/api/lessons");
      if (res.ok) setNextLessonOptions(await res.json());
    } catch (e) {
      console.error(e);
    }
    setShowNextLessonModal(true);
  };

  // When instructor or day changes, update filtered lessons
  useEffect(() => {
    if (selectedInstructorId && selectedDay !== "") {
      setFilteredLessons(
        nextLessonOptions.filter(
          (l) => l.instructor?.user?.name === selectedInstructorId && l.dayOfWeek === Number(selectedDay)
        )
      );
      setSelectedNextLesson(null);
    } else {
      setFilteredLessons([]);
      setSelectedNextLesson(null);
    }
  }, [selectedInstructorId, selectedDay, nextLessonOptions]);

  // Confirm next lesson
  const handleNextLessonConfirm = async () => {
    if (!selectedChild || !selectedNextLesson || !selectedLesson) return;
    const copyProgress = selectedNextLesson.classLevel.id === selectedLesson.classLevel.id;
    try {
      await fetch("/api/enrollments/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChild.id,
          nextLessonId: selectedNextLesson.id,
          copyProgress,
        }),
      });
      await refreshChildren();
    } catch (e) {
      console.error(e);
    } finally {
      setShowNextLessonModal(false);
    }
  };

  // Card click toggle
  const handleCardClick = (child: Child, lesson: Lesson) => {
    if (selectedLesson?.enrollmentId === lesson.enrollmentId) {
      setSelectedChild(null);
      setSelectedLesson(null);
    } else {
      setSelectedChild(child);
      setSelectedLesson(lesson);
    }
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100); // allow render
  };

  // Flatten & sort
  const allFlatLessons = children
    .flatMap((c) => c.lessons.map((l) => ({ child: c, ...l })))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  // Filter lessons for Active/All
  const flatLessons = lessonFilter === 'active'
    ? allFlatLessons.filter(lesson => {
        if (!lesson.startTime) return false;
        let lessonDate;
        try {
          lessonDate = new Date(lesson.startTime);
        } catch {
          return false;
        }
        if (isNaN(lessonDate.getTime())) return false;
        // Use UTC to avoid timezone issues
        return lessonDate.getUTCFullYear() === currentYear && (lessonDate.getUTCMonth() + 1) === currentMonth;
      })
    : allFlatLessons;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Children</h1>
        <button
          onClick={() => setIsAddingChild(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Child
        </button>
      </div>
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogTitle>Success</DialogTitle>
          <p>{successMessage}</p>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowSuccessDialog(false)}>Acknowledge</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Filter below the title for better responsive display */}
      <div className="flex gap-2 items-center mb-4">
        <label className="text-sm font-medium">Show:</label>
        <button
          className={`px-2 py-1 rounded ${lessonFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setLessonFilter('active')}
        >
          Active
        </button>
        <button
          className={`px-2 py-1 rounded ${lessonFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setLessonFilter('all')}
        >
          All
        </button>
      </div>

      {/* Cards Grid */}
      {flatLessons.length === 0 ? (
        <p className="text-gray-500">No lessons found. Add a child to get started.</p>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flatLessons.map(({ child, ...lesson }) => {
            const age = child.birthDate
              ? differenceInYears(new Date(), new Date(child.birthDate))
              : null;
            return (
              <div key={lesson.enrollmentId}>
                <div
                  onClick={() => handleCardClick(child, lesson)}
                  className={`bg-white border border-gray-200 rounded-lg p-4 shadow transition hover:shadow-lg cursor-pointer ${
                    selectedLesson?.enrollmentId === lesson.enrollmentId ? "ring-2 ring-indigo-400" : ""
                  }`}
                >
                                      {lesson && (
                      <div className="mt-2 text-xs text-gray-500 font-normal">
                      {formatDate(lesson.startDate)} • {getDayName(lesson.dayOfWeek)}s • {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                      </div>
                    )}

                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: lesson?.classLevel?.color || "#3b82f6" }}
                    >
                      {lesson?.classLevel?.name || "Unnamed Level"}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openNextLessonModal(child, lesson);
                        }}
                        className="text-indigo-300 hover:text-blue-700"
                        title="Select Next Lesson"
                      >
                        <ArrowRightCircle className="h-5 w-5" />
                      </button>
                      <DeleteConfirmationDialog
                        onDelete={async () => {
                          setIsDeleting(true);
                          try {
                            const res = await fetch(`/api/enrollments/${lesson.enrollmentId}`, { method: "DELETE" });
                            if (!res.ok) throw new Error("Delete failed");
                            if (child.lessons.length === 1) {
                              await fetch(`/api/children/${child.id}`, { method: "DELETE" });
                            }
                            await refreshChildren();
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                        isDeleting={isDeleting}
                        itemType="lesson"
                        itemName={lesson?.classLevel?.name || "Unnamed Level"}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xl font-semibold">{child.name}</span>
                    {age !== null && <span className="text-gray-500">({age})</span>}
                    {lesson.readyForNextLevel && <GraduationCap className="h-6 w-6 text-green-600" />}
                  </div>
                  <div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{
                          width: `${
                            lesson.skills && lesson.skills.length > 0
                              ? (lesson.skills.filter((s) => s.status === "COMPLETED").length / lesson.skills.length) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-1">
                      {(lesson.skills?.filter((s) => s.status === "COMPLETED").length || 0)} of { (lesson.skills?.length || 0)} skills completed
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Skills Panel */}
      {selectedChild && selectedLesson && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow border" ref={scrollRef}>
<div className="text-xs text-gray-500 font-normal mb-2">
            {formatDate(selectedLesson.startDate)} • {getDayName(selectedLesson.dayOfWeek)}s • {formatTime(selectedLesson.startTime)} - {formatTime(selectedLesson.endTime)}
    </div>

          <h2 className="text-xl font-semibold mb-2">Skills for {selectedChild.name} ({selectedChild.birthDate
              ? differenceInYears(new Date(), new Date(selectedChild.birthDate))
              : null})</h2>

    {selectedLesson.readyForNextLevel && (
                      <div className="text-xs text-gray-500 font-normal mb-4"> Ready For 
                      <span className="ml-2 rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: nextLevelColor || "#3b82f6" }}
                    >
                      {nextLevelName}
                    </span>
                </div>
    )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedLesson.skills?.map((skill) => (
              <div key={skill.id} className="rounded-lg bg-gray-50 p-4 shadow-inner">
                <h3 className="text-lg font-medium">{skill.name}</h3>
                {skill.description && <p className="mt-1 text-sm text-gray-600">{skill.description}</p>}
                <div className="flex space-x-4 justify-center mt-3">
                  {(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as Skill["status"][]).map((st) => (
                    <div
                      key={st}
                      className={`w-12 h-12 flex items-center justify-center rounded-full ${
                        skill.status === st ? getStatusColor(st) : "bg-gray-200 text-gray-400"
                      }`}
                      title={st.replace("_", " ")}
                    >
                      {getStatusIcon(st)}
                    </div>
                  ))}
                </div>
                {skill.notes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Notes:</p>
                    <p className="mt-1 text-sm whitespace-pre-line">{skill.notes}</p>
                  </div>
                )}
                {skill.strengthNotes && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-green-700">Strengths:</p>
                    <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">{skill.strengthNotes}</p>
                  </div>
                )}
                {skill.improvementNotes && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-blue-700">Areas for Improvement:</p>
                    <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">{skill.improvementNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {(selectedLesson.strengthNotes || selectedLesson.improvementNotes) && (
            <div className="mt-6 space-y-4 bg-gray-50 p-4 rounded">
              {selectedLesson.strengthNotes && (
                <div>
                  <h4 className="text-sm font-semibold text-green-700">I'm really good at:</h4>
                  <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">{selectedLesson.strengthNotes}</p>
                </div>
              )}
              {selectedLesson.improvementNotes && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-700">I can improve on:</h4>
                  <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">{selectedLesson.improvementNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Child Modal */}
      {isAddingChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <AddChildForm
              onSuccess={(childName, instructorName) => {
                setIsAddingChild(false);
                setSuccessMessage(`Your child, ${childName}, has been added successfully. Please let ${instructorName} know ${childName} has been added.`);
                setShowSuccessDialog(true);
                refreshChildren();
              }}
              onCancel={() => setIsAddingChild(false)}
            />
          </div>
        </div>
      )}

      {/* Next Lesson Dialog */}
      <Dialog open={showNextLessonModal} onOpenChange={setShowNextLessonModal}>
        <DialogContent>
          <DialogTitle>Select Next Lesson</DialogTitle>

          {/* Current Lesson */}
          {selectedLesson && (
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <div className="font-semibold">Current Lesson:</div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: selectedLesson?.classLevel?.color || "#3b82f6" }}
              >
                {selectedLesson?.classLevel?.name || "Unnamed Level"}
              </span>
              <p className="mt-2 text-xs text-gray-500 font-normal">
                {getDayName(selectedLesson.dayOfWeek)}s, {formatTime(selectedLesson.startTime)} –{" "}
                {formatTime(selectedLesson.endTime)}
              </p>
            </div>
          )}

          {/* Instructor Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Instructor</label>
            <select
              className="block w-full border rounded p-2"
              value={selectedInstructorId}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
            >
              <option value="">Select instructor</option>
              {Array.from(
                new Set(nextLessonOptions.map((l) => l.instructor?.user?.name).filter(Boolean))
                ).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Day Select */}
          {selectedInstructorId && (
            <div className="space-y-2 mt-4">
              <label className="block text-sm font-medium">Day of Week</label>
              <select
                className="block w-full border rounded p-2"
                value={selectedDay}
                onChange={(e) =>
                  setSelectedDay(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                 <option value="">Select a day</option>
                 {[...new Set(
                    nextLessonOptions
                    .filter((l) => l.instructor?.user?.name === selectedInstructorId)
                    .map((l) => l.dayOfWeek)
                    )].map((day) => (
                    <option key={day} value={day}>
                      {getDayName(day)}
                </option>
                ))}
              </select>
            </div>
          )}

          {/* Lesson Select */}
          {selectedInstructorId && selectedDay !== "" && (
            <div className="space-y-2 mt-4">
              <label className="block text-sm font-medium">Lesson</label>
              <select
                className="block w-full border rounded p-2"
                value={selectedNextLesson?.id || ""}
                onChange={(e) => {
                  const l = filteredLessons.find((x) => x.id === e.target.value) || null;
                  setSelectedNextLesson(l);
                }}
              >
                <option value="">Select lesson</option>
                {filteredLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.classLevel.name}, {formatDate(l.startDate)} at {formatTime(l.startTime)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-2">
            <Button
              onClick={() => setShowNextLessonModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNextLessonConfirm}
              disabled={!selectedNextLesson}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}