"use client";

import { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { AddChildForm } from "@/components/parents/add-child-form";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, MoreHorizontal, GraduationCap, ArrowRightCircle } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { DeleteConfirmationDialog } from "@/components/instructors/delete-confirmation-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  sortOrder?: number;
  color?: string;
}

interface Lesson {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  instructor?: {
    user?: {
      name: string;
    };
  };
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

function formatTime(time: Date | string) {
  if (!time) return '';
  const date = typeof time === 'string' ? new Date(time) : time;
  return format(date, 'h:mm a');
}

function getDayName(dayOfWeek: number) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

export default function ParentDashboard({ children: initialChildren }: ParentDashboardProps) {
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [nextLevelName, setNextLevelName] = useState<string>("");
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNextLessonModal, setShowNextLessonModal] = useState(false);
  const [nextLessonOptions, setNextLessonOptions] = useState<Lesson[]>([]);
  const [selectedNextLesson, setSelectedNextLesson] = useState<Lesson | null>(null);
  const [nextLessonChild, setNextLessonChild] = useState<Child | null>(null);
  const [nextLessonCurrentLesson, setNextLessonCurrentLesson] = useState<Lesson | null>(null);

  // Function to refresh children data
  const refreshChildren = async () => {
    try {
      const response = await fetch('/api/children');
      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }
      const updatedChildren = await response.json();
      setChildren(updatedChildren);
    } catch (error) {
      console.error('Error refreshing children:', error);
    }
  };

  // Load data on mount and poll for updates
  useEffect(() => {
    refreshChildren();
    const interval = setInterval(refreshChildren, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch next level name when a lesson is selected
  useEffect(() => {
    const fetchNextLevel = async () => {
      if (selectedLesson?.classLevel?.id) {
        try {
          const response = await fetch(`/api/class-levels/next/${selectedLesson.classLevel.id}`);
          if (response.ok) {
            const data = await response.json();
            setNextLevelName(data.name);
          }
        } catch (error) {
          console.error('Error fetching next level:', error);
        }
      }
    };
    fetchNextLevel();
  }, [selectedLesson]);

  const getStatusColor = (status: Skill["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 hover:bg-green-200 text-green-600";
      case "IN_PROGRESS":
        return "bg-yellow-100 hover:bg-yellow-200 text-yellow-600";
      case "NOT_STARTED":
        return "bg-blue-100 hover:bg-blue-200 text-blue-600";
      default:
        return "bg-gray-100 hover:bg-gray-200 text-gray-600";
    }
  };

  const getStatusIcon = (status: Skill["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-8 w-8" />;
      case "IN_PROGRESS":
        return <Clock className="h-8 w-8" />;
      default:
        return <MoreHorizontal className="h-8 w-8" />;
    }
  };

  const handleReadyToggle = async (enrollmentId: string, ready: boolean) => {
    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}/ready`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ready }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ready status');
      }

      // Refresh the children data to update the UI
      await refreshChildren();
    } catch (error) {
      console.error('Error updating ready status:', error);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete child");
      }
      await refreshChildren();
      setDeletingChildId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete child");
    } finally {
      setIsDeleting(false);
    }
  };

  const openNextLessonModal = async (child: Child, currentLesson: Lesson) => {
    setNextLessonChild(child);
    setNextLessonCurrentLesson(currentLesson);
    // Fetch all lessons (like AddChildForm)
    const res = await fetch(`/api/lessons`);
    if (res.ok) {
      const lessons = await res.json();
      setNextLessonOptions(lessons);
      setShowNextLessonModal(true);
    } else {
      console.error('Failed to fetch lessons');
    }
  };

  const handleNextLessonConfirm = async () => {
    if (!nextLessonChild || !selectedNextLesson || !nextLessonCurrentLesson) return;
    const copyProgress = selectedNextLesson.classLevel.id === nextLessonCurrentLesson.classLevel.id;
    await fetch('/api/enrollments/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId: nextLessonChild.id,
        nextLessonId: selectedNextLesson.id,
        copyProgress,
      }),
    });
    setShowNextLessonModal(false);
    setSelectedNextLesson(null);
    setNextLessonChild(null);
    setNextLessonCurrentLesson(null);
    refreshChildren();
  };

  if (selectedChild && selectedLesson) {
    const currentLesson = selectedLesson;

    let age = null;
    if (selectedChild.birthDate) {
      age = differenceInYears(new Date(), new Date(selectedChild.birthDate));
    }
    if (!currentLesson) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setSelectedChild(null);
                  setSelectedLesson(null);
                  refreshChildren();
                }}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Back to Children
              </button>
              <span className="text-xl font-semibold text-gray-900">
                {selectedChild.name}
                {age !== null && (
                  <span className="ml-2 text-gray-500 text-base">({age})</span>
                )}
              </span>
            </div>
          </div>
          <p className="text-gray-500">Your child isn&apos;t enrolled in any lessons yet.</p>
        </div>
      );
    }

    const completedSkills = currentLesson.skills?.filter(s => s.status === "COMPLETED").length || 0;
    
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedChild(null);
            setSelectedLesson(null);
            refreshChildren();
          }}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Back to Children
        </button>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-2xl border bg-slate-400 p-4 shadow-sm">
            {currentLesson && (
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  {format(new Date(currentLesson.startDate), 'MMMM yyyy')} • {getDayName(currentLesson.dayOfWeek)}s • {formatTime(currentLesson.startTime)} - {formatTime(currentLesson.endTime)}
                </p>
              </div>
            )}
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white w-fit"
              style={{ backgroundColor: currentLesson.classLevel?.color || '#3b82f6' }}
            >
              {currentLesson.classLevel?.name || currentLesson.name}
            </span>

            <h2 className="text-xl font-semibold text-gray-900">
              {selectedChild.name} {
                  age !== null && (
                <span className="ml-2 text-gray-700 text-xl">({age})</span>
              )}
            </h2>
            <p className="text-sm text-gray-900">
              {completedSkills} of {currentLesson.skills?.length || 0} skills completed
            </p>
            {nextLevelName && currentLesson.readyForNextLevel && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900">
                 Ready for  &nbsp;
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white w-fit"
                    style={{ backgroundColor: currentLesson.classLevel?.color || '#3b82f6' }}
                  >
                    {nextLevelName}
                  </span>
                </span>
            </div>
          )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentLesson.skills?.map((skill) => (
            <div
              key={skill.id}
              className="rounded-2xl bg-white p-4 shadow-md transition-transform hover:scale-105 hover:shadow-xl"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {skill.name}
                </h3>
                {skill.description && (
                  <p className="text-sm text-gray-500">{skill.description}</p>
                )}
                <div className="flex space-x-6 justify-center mt-4">
                  {["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].map((status) => (
                    <div
                      key={status}
                      className={`flex items-center justify-center w-16 h-16 rounded-full ${
                        skill.status === status || (status === "NOT_STARTED" && !skill.status)
                          ? getStatusColor(status as Skill["status"])
                          : "bg-gray-50 text-gray-400"
                      }`}
                      title={status.replace("_", " ")}
                    >
                      {getStatusIcon(status as Skill["status"])}
                    </div>
                  ))}
                </div>
                {skill.notes && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-700">Instructor Notes:</p>
                    <p className="mt-1 text-xs text-gray-900 whitespace-pre-line">{skill.notes}</p>
                  </div>
                )}
              </div>
              {skill.strengthNotes && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-green-700">Strengths:</p>
                  <p className="mt-1 text-sm text-gray-600">{skill.strengthNotes}</p>
                </div>
              )}
              {skill.improvementNotes && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-blue-700">Areas for Improvement:</p>
                  <p className="mt-1 text-sm text-gray-600">{skill.improvementNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {(currentLesson.strengthNotes || currentLesson.improvementNotes) && (
          <div className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-300">
            <h3 className="text-lg font-medium text-gray-900">Overall Progress Notes</h3>
            <div className="space-y-4">
              {currentLesson.strengthNotes && (
                <div>
                  <h4 className="text-sm font-medium text-green-700">I&apos;m Awesome At:</h4>
                  <div className="mt-1 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-gray-900">{currentLesson.strengthNotes}</p>
                  </div>
                </div>
              )}
              {currentLesson.improvementNotes && (
                <div>
                  <h4 className="text-sm font-medium text-blue-700">I Can Improve On:</h4>
                  <div className="mt-1 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-gray-900">{currentLesson.improvementNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Children</h1>
        <button
          onClick={() => setIsAddingChild(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Child
        </button>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">You haven&apos;t added any children yet. Click &quot;Add Child&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Get all lessons from all children and sort them by startDate */}
          {children
            .flatMap(child => child.lessons.map(lesson => ({
              ...lesson,
              child,
              classLevel: lesson.classLevel // Ensure classLevel is explicitly included
            })))
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .map(({ child, ...currentLesson }) => {
              let age = null;
              if (child.birthDate) {
                age = differenceInYears(new Date(), new Date(child.birthDate));
              }
              return (
                <div
                  key={`${child.id}-${currentLesson.enrollmentId}`}
                  className="rounded-2xl bg-white p-4 shadow-md transition-transform hover:scale-105 hover:shadow-xl"
                 onClick={e => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    setSelectedChild(child);
                    setSelectedLesson(currentLesson);
                  }}
                >
                  <div>
                    {currentLesson && (
                      <div className="mt-2 text-xs text-gray-500 font-normal">
                      { format(new Date(currentLesson.startDate), 'MMMM yyyy')} • {format(new Date(currentLesson.startTime), 'EEEE')}s • {format(new Date(currentLesson.startTime), 'h:mm')} - {format(new Date(currentLesson.endTime), 'h:mm a')}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white shadow-sm"
                        style={{ backgroundColor: currentLesson.classLevel?.color || '#3b82f6' }}
                      >
                        {currentLesson.classLevel?.name || currentLesson.name}
                      </span>
                      {/* Right-aligned actions container */}
                      <div className="flex items-center space-x-2 ml-auto">
                        <button
                          onClick={e => {
                           e.stopPropagation();
                            openNextLessonModal(child, currentLesson);
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
                              const res = await fetch(`/api/enrollments/${currentLesson.enrollmentId}`, { method: 'DELETE' });
                              if (!res.ok) throw new Error('Failed to delete enrollment');
                              if (child.lessons.length === 1) {
                                await fetch(`/api/children/${child.id}`, { method: 'DELETE' });
                              }
                              refreshChildren();
                            } catch (error) {
                                alert(error instanceof Error ? error.message : 'Failed to delete enrollment');
                            } finally {
                                setIsDeleting(false);
                            }
                          }}
                          isDeleting={isDeleting && deletingChildId === child.id}
                          itemType="lesson"
                          itemName={currentLesson.classLevel?.name || currentLesson.name}
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="text-xl font-semibold flex items-center">
                        {child.name}
                        {age !== null && (
                          <span className="ml-2 text-gray-500 text-base">({age})</span>
                        )}
                        {currentLesson.readyForNextLevel && (
                          <GraduationCap className="h-6 w-6 text-green-600 ml-2" />
                        )}               
                      </span>  
                    </div>
                    {!currentLesson ? (
                      <p className="text-gray-500">Not enrolled in any lessons yet.</p>
                    ) : (
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${currentLesson.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {currentLesson.skills?.filter(s => s.status === "COMPLETED").length || 0} of {currentLesson.skills?.length || 0} skills completed
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
        </div>
      )}

      {isAddingChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <AddChildForm
              onSuccess={() => {
                setIsAddingChild(false);
                refreshChildren();
              }}
              onCancel={() => setIsAddingChild(false)}
            />
          </div>
        </div>
      )}

      {/* Next Lesson Modal */}
      <Dialog open={showNextLessonModal} onOpenChange={setShowNextLessonModal}>
        <DialogContent>
          <DialogTitle>Select Next Lesson</DialogTitle>
          {nextLessonCurrentLesson && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="font-semibold">Current Lesson:</div>
              <div>
              <span
                              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                              style={{ backgroundColor: nextLessonCurrentLesson.classLevel?.color || '#3b82f6' }}
                            >
                              {nextLessonCurrentLesson.classLevel?.name || nextLessonCurrentLesson.name}
                            </span>
                <br />
                {getDayName(nextLessonCurrentLesson.dayOfWeek)}s, {formatTime(nextLessonCurrentLesson.startTime)} - {formatTime(nextLessonCurrentLesson.endTime)}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="next-lesson-select" className="block text-sm font-medium text-gray-700 mb-1">Choose a lesson:</label>
            <select
              id="next-lesson-select"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedNextLesson?.id || ''}
              onChange={e => {
                const lesson = nextLessonOptions.find(l => l.id === e.target.value);
                setSelectedNextLesson(lesson || null);
              }}
            >
              <option value="" disabled>Select a lesson</option>
              {nextLessonOptions.map((lesson) => {
                const startMonth = format(new Date(lesson.startDate), 'MMMM');
                const dayOfWeek = getDayName(lesson.dayOfWeek) + 's';
                const startTime = formatTime(lesson.startTime);
                const endTime = formatTime(lesson.endTime);
                return (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.classLevel.name}, {startMonth}, {dayOfWeek}, {startTime} - {endTime}, with {lesson.instructor?.user?.name}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              onClick={() => setShowNextLessonModal(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={!selectedNextLesson}
              onClick={handleNextLessonConfirm}
              type="button"
            >
              Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 