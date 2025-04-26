"use client";

import { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { AddChildForm } from "@/components/parents/add-child-form";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, MoreHorizontal, GraduationCap, Trash2 } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { DeleteConfirmationDialog } from "@/components/instructors/delete-confirmation-dialog";

interface Skill {
  id: string;
  name: string;
  description?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  strengthNotes?: string;
  improvementNotes?: string;
}

interface ClassLevel {
  id: string;
  name: string;
  sortOrder: number;
  color: string;
}

interface Lesson {
  id: string;
  name: string;
  progress: number;
  skills: Skill[];
  classLevel: ClassLevel;
  readyForNextLevel: boolean;
  strengthNotes?: string;
  improvementNotes?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
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

  if (selectedChild) {
    const currentLesson = selectedChild.lessons[0]; // Show the first/current lesson
    if (!currentLesson) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setSelectedChild(null);
                  refreshChildren();
                }}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Back to Children
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedChild.name}
              </h2>
            </div>
          </div>
          <p className="text-gray-500">Your child isn&apos;t enrolled in any lessons yet.</p>
        </div>
      );
    }

    const completedSkills = currentLesson.skills.filter(s => s.status === "COMPLETED").length;
    
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedChild(null);
            refreshChildren();
          }}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Back to Children
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedChild.name}
            </h2>
            {currentLesson && (
              <span 
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                style={{ backgroundColor: currentLesson.classLevel?.color || '#3b82f6' }}
              >
                {currentLesson.classLevel?.name}
              </span>
            )}
          </div>
          {currentLesson && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">
                {new Date(currentLesson.startTime).toLocaleString('default', { month: 'long' })} {new Date(currentLesson.startTime).getFullYear()}
              </p>
              <p className="text-sm text-gray-500">
                Every {getDayName(currentLesson.dayOfWeek)}, {formatTime(currentLesson.startTime)} - {formatTime(currentLesson.endTime)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {completedSkills} of {currentLesson.skills.length} skills completed
          </div>
          {nextLevelName && currentLesson.readyForNextLevel && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Ready for {nextLevelName}
              </span>
              <div className="h-4 w-4 rounded-full border bg-green-500 border-green-600" />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentLesson.skills.map((skill) => (
            <div
              key={skill.id}
              className="relative rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
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
    <div className="p-8">
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
          {children.map((child) => {
            const currentLesson = child.lessons[0];
            let age = null;
            if (child.birthDate) {
              age = differenceInYears(new Date(), new Date(child.birthDate));
            }
            return (
              <div key={child.id} className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <DeleteConfirmationDialog
                    onDelete={() => handleDeleteChild(child.id)}
                    isDeleting={isDeleting && deletingChildId === child.id}
                    itemType="child"
                    itemName={child.name}
                  />
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedChild(child);
                    if (child.lessons[0]) {
                      setSelectedLesson(child.lessons[0]);
                    }
                  }}
                  onKeyPress={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedChild(child);
                      if (child.lessons[0]) {
                        setSelectedLesson(child.lessons[0]);
                      }
                    }
                  }}
                  className="block text-left w-full cursor-pointer"
                >
                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col h-full justify-between">
                    <div>
                      <div className="mb-2">
                        <h2 className="text-xl font-semibold flex items-center">
                          {child.name}
                          {age !== null && (
                            <span className="ml-2 text-gray-500 text-base">({age})</span>
                          )}
                        </h2>
                        {currentLesson && (
                          <div className="flex items-center justify-between mt-1">
                            <span
                              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                              style={{ backgroundColor: currentLesson.classLevel?.color || '#3b82f6' }}
                            >
                              {currentLesson.classLevel?.name || currentLesson.name}
                            </span>
                            {currentLesson.readyForNextLevel && (
                              <GraduationCap className="h-6 w-6 text-green-600 ml-2" />
                            )}
                          </div>
                        )}
                      </div>
                      {!currentLesson ? (
                        <p className="text-gray-500">Not enrolled in any lessons yet.</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                style={{ width: `${currentLesson.progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 text-right">
                              {currentLesson.skills.filter(s => s.status === "COMPLETED").length} of {currentLesson.skills.length} skills completed
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {currentLesson && (
                      <div className="mt-4 text-xs text-gray-500 font-normal">
                        {format(new Date(currentLesson.startDate), 'MMMM yyyy')} • {format(new Date(currentLesson.startTime), 'EEEE')}s • {format(new Date(currentLesson.startTime), 'h:mm a')} - {format(new Date(currentLesson.endTime), 'h:mm a')}
                      </div>
                    )}
                  </div>
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
    </div>
  );
} 