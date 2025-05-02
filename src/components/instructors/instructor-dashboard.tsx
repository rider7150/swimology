"use client";

import { useState, useEffect } from "react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle, Clock, MoreHorizontal, GraduationCap } from "lucide-react";
import { differenceInYears } from "date-fns";

interface Skill {
  id: string;
  name: string;
  description?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  notes?: string;
}

interface ClassLevel {
  id: string;
  name: string;
  sortOrder: number;
  color: string;
}

interface Student {
  id: string;
  name: string;
  enrollmentId: string;
  classLevel: ClassLevel;
  skills: Skill[];
  strengthNotes?: string;
  improvementNotes?: string;
  readyForNextLevel: boolean;
  birthDate?: string;
}

interface Lesson {
  id: string;
  name: string;
  students: Student[];
  classLevel: ClassLevel;
  month: number;
  year: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface EnrollmentWithDetails {
  id: string;
  readyForNextLevel: boolean;
  classLevel: ClassLevel;
  strengthNotes?: string;
  improvementNotes?: string;
}

interface InstructorDashboardProps {
  lessons: Lesson[];
}

export function InstructorDashboard({ lessons: initialLessons }: InstructorDashboardProps) {
//  console.log('Initial Lessons:', JSON.stringify(initialLessons, null, 2));

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [updatingSkill, setUpdatingSkill] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    // Format the initial lessons data when component mounts
    return initialLessons.map(lesson => ({
      ...lesson,
      startTime: lesson.startTime || '',
      endTime: lesson.endTime || ''
    }));
  });
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [nextLevelName, setNextLevelName] = useState<string>("");
  const [draftState, setDraftState] = useState<{
    skills: { [key: string]: Skill["status"] };
    notes: { strength: string; improvement: string };
    skillNotes: { [key: string]: string };
    readyForNextLevel: boolean;
  }>({
    skills: {},
    notes: { strength: "", improvement: "" },
    skillNotes: {},
    readyForNextLevel: false
  });

  
  const [_, setForceUpdate] = useState(0);

  useEffect(() => {
    setForceUpdate(f => f + 1);
  }, [lessons]);

  useEffect(() => {
    // Call refreshLessons on initial load
    refreshLessons();
}, []); // Empty dependency array means this runs once on mount

  // Helper function to format time
  const formatTime = (time: string) => {
    if (!time) return '';
    
    try {
      // If time is already in HH:mm format
      if (time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
        console.log('time', time);
        const [hours, minutes] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit',timeZone: 'America/Los_Angeles' });
      }
      return ''; // Return empty string if format doesn't match
    } catch (error) {
      console.error('Error formatting time:', error);
      return ''; // Return empty string on error
    }
  };

  // Helper function to get month name
  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  // Helper function to get day name
  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  // Group lessons by month, day, and time
  const groupedLessons = lessons.reduce((acc, lesson) => {
    // Ensure month is a number
    const month = typeof lesson.month === 'number' ? lesson.month : 
                 typeof lesson.month === 'string' ? parseInt(lesson.month) : 
                 new Date().getMonth() + 1;
    
    const monthStr = month.toString().padStart(2, '0');
    const monthKey = `${lesson.year}-${monthStr}`;
    const dayKey = lesson.dayOfWeek;
    const timeKey = `${lesson.startTime || ''}-${lesson.endTime || ''}`;

    if (!acc[monthKey]) {
      acc[monthKey] = {};
    }
    if (!acc[monthKey][dayKey]) {
      acc[monthKey][dayKey] = {};
    }
    if (!acc[monthKey][dayKey][timeKey]) {
      acc[monthKey][dayKey][timeKey] = [];
    }
    acc[monthKey][dayKey][timeKey].push(lesson);
    return acc;
  }, {} as Record<string, Record<number, Record<string, Lesson[]>>>);

  const refreshLessons = async () => {
    try {
      const response = await fetch('/api/lessons');
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }
      const updatedLessons = await response.json();
      // Ensure the updated lessons have proper time formatting
      setLessons(updatedLessons.map((lesson: Lesson) => ({
        ...lesson,
        startTime: lesson.startTime || '',
        endTime: lesson.endTime || ''
      })));
    } catch (error) {
      console.error('Error refreshing lessons:', error);
    }
  };



  // Fetch next level name when a student is selected
  useEffect(() => {
    const fetchNextLevel = async () => {
      if (selectedStudent?.classLevel?.id) {
        try {
          const response = await fetch(`/api/class-levels/next/${selectedStudent.classLevel.id}`);
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
  }, [selectedStudent]);

  // Effect to update selectedEnrollment when student is selected
  useEffect(() => {
    if (selectedStudent) {
      setSelectedEnrollment({
        id: selectedStudent.enrollmentId,
        readyForNextLevel: selectedStudent.readyForNextLevel,
        classLevel: selectedStudent.classLevel,
        strengthNotes: selectedStudent.strengthNotes,
        improvementNotes: selectedStudent.improvementNotes
      });
    }
  }, [selectedStudent]);

  // Update draft state when student/enrollment changes
  useEffect(() => {
    if (selectedStudent && selectedEnrollment) {
      const skillStatuses = Object.fromEntries(
        selectedStudent.skills.map(skill => [skill.id, skill.status])
      );
      const skillNotes = Object.fromEntries(
        selectedStudent.skills.map(skill => [skill.id, skill.notes || ""])
      );
      setDraftState({
        skills: skillStatuses,
        notes: {
          strength: selectedEnrollment.strengthNotes || "",
          improvement: selectedEnrollment.improvementNotes || ""
        },
        skillNotes,
        readyForNextLevel: selectedEnrollment.readyForNextLevel
      });
    }
  }, [selectedStudent, selectedEnrollment]);

  const handleStatusChange = (skillId: string, newStatus: Skill["status"]) => {
    setDraftState(prev => ({
      ...prev,
      skills: { ...prev.skills, [skillId]: newStatus }
    }));
  };

  const handleReadyToggle = (checked: boolean) => {
    setDraftState(prev => ({
      ...prev,
      readyForNextLevel: checked
    }));
  };

  const handleSave = async () => {
    if (!selectedStudent || !selectedEnrollment) return;
    setUpdatingSkill(true);

    try {
      // Update skill statuses and notes
      const skillUpdatePromises = Object.entries(draftState.skills).map(([skillId, status]) =>
        fetch("/api/skills/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skillId,
            enrollmentId: selectedStudent.enrollmentId,
            status,
            notes: draftState.skillNotes[skillId] || ""
          }),
        })
      );

      // Update notes
      const notesUpdate = fetch(`/api/enrollments/${selectedEnrollment.id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strengthNotes: draftState.notes.strength,
          improvementNotes: draftState.notes.improvement,
        }),
      });

      // Update ready status
      const readyUpdate = fetch(`/api/enrollments/${selectedEnrollment.id}/ready`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ready: draftState.readyForNextLevel }),
      });

      // Await all skill updates and check for errors
      const skillResponses = await Promise.all(skillUpdatePromises);
      const failedSkills = skillResponses.filter(res => !res.ok);
      let errorMsg = "";
      if (failedSkills.length > 0) {
        // Try to get error message from first failed response
        try {
          const err = await failedSkills[0].json();
          errorMsg = err.error || "Failed to save some skill progress.";
        } catch {
          errorMsg = "Failed to save some skill progress.";
        }
      }

      // Await notes and ready status updates
      const [notesRes, readyRes] = await Promise.all([notesUpdate, readyUpdate]);
      if (!notesRes.ok || !readyRes.ok) {
        errorMsg = "Failed to save enrollment notes or ready status.";
      }

      if (errorMsg) {
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
      // Refresh data
      await refreshLessons();
        setSelectedStudent(null);
      toast({
        title: "Success",
        description: "All changes saved successfully",
      });
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setUpdatingSkill(false);
    }
  };

  const handleCancel = () => {
    if (selectedStudent && selectedEnrollment) {
      const skillStatuses = Object.fromEntries(
        selectedStudent.skills.map(skill => [skill.id, skill.status])
      );
      setDraftState({
        skills: skillStatuses,
        notes: {
          strength: selectedEnrollment.strengthNotes || "",
          improvement: selectedEnrollment.improvementNotes || ""
        },
        skillNotes: {},
        readyForNextLevel: selectedEnrollment.readyForNextLevel
      });
    }
  };

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

  return (
    <div className="space-y-6">
      {selectedStudent ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  refreshLessons();
                }}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                &lt;
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedStudent.name}
                  <span 
                    className="ml-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                    style={{ backgroundColor: selectedStudent.classLevel.color || "#3B82F6" }}
                  >
                    {selectedStudent.classLevel.name}
                  </span>
                </h2>
              </div>
            </div>
            {nextLevelName && (
              <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-lg">
                <label htmlFor="ready-toggle" className="text-sm font-medium text-gray-900">
                  Ready for {nextLevelName}
                </label>
                <Switch
                  id="ready-toggle"
                  checked={draftState.readyForNextLevel}
                  onCheckedChange={handleReadyToggle}
                  className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-200"
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${(selectedStudent.skills.filter((s) => draftState.skills[s.id] === "COMPLETED").length / selectedStudent.skills.length) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">
              {selectedStudent.skills.filter((s) => draftState.skills[s.id] === "COMPLETED").length} of {selectedStudent.skills.length} skills completed
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedStudent.skills.map((skill) => (
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
                      <button
                        key={status}
                        disabled={updatingSkill}
                        onClick={() => handleStatusChange(skill.id, status as Skill["status"])}
                        className={`flex items-center justify-center w-16 h-16 rounded-full ${
                          draftState.skills[skill.id] === status || (status === "NOT_STARTED" && !draftState.skills[skill.id])
                            ? getStatusColor(status as Skill["status"])
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                        title={status.replace("_", " ")}
                      >
                        {getStatusIcon(status as Skill["status"])}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Instructor Notes</label>
                    <textarea
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={2}
                      placeholder="Add notes for this skill..."
                      value={draftState.skillNotes[skill.id] || ""}
                      onChange={e => setDraftState(prev => ({
                        ...prev,
                        skillNotes: { ...prev.skillNotes, [skill.id]: e.target.value }
                      }))}
                      disabled={updatingSkill}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedEnrollment && (
            <div className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-300">
              <h3 className="text-lg font-medium text-gray-900">Progress Notes</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="strength-notes" className="block text-sm font-medium text-green-700">
                    I'm Awesome At:
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="strength-notes"
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm bg-green-50 text-gray-900"
                      placeholder="Add notes about strengths..."
                      value={draftState.notes.strength}
                      onChange={(e) => setDraftState(prev => ({
                        ...prev,
                        notes: { ...prev.notes, strength: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="improvement-notes" className="block text-sm font-medium text-blue-700">
                    I Can Improve On:
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="improvement-notes"
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-blue-50 text-gray-900"
                      placeholder="Add notes about areas for improvement..."
                      value={draftState.notes.improvement}
                      onChange={(e) => setDraftState(prev => ({
                        ...prev,
                        notes: { ...prev.notes, improvement: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              disabled={updatingSkill}
            >
              Reset Changes
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-500"
              disabled={updatingSkill}
            >
              Save All Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">My Lessons</h2>
          {Object.entries(groupedLessons)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([monthKey, dayGroups]) => {

              const [year, month] = monthKey.split('-').map(Number);
              return (
                <div key={monthKey} className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {getMonthName(month)} {year}
                  </h3>
                  <div className="space-y-6">
                    {Object.entries(dayGroups)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([dayKey, timeGroups]) => (
                        <div key={dayKey} className="space-y-4">
                          <h4 className="text-md font-medium text-gray-700">
                            {getDayName(Number(dayKey))}
                          </h4>
                          <div className="space-y-4">
                            {Object.entries(timeGroups)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([timeKey, lessonGroup]) => {
                                const [startTime, endTime] = timeKey.split('-');
                                return (
                                  <div key={timeKey} className="pl-4 border-l-2 border-gray-200">
                                    <h5 className="text-sm font-medium text-gray-600 mb-3">
                                      {formatTime(startTime)} - {formatTime(endTime)}
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                      {lessonGroup.flatMap(lesson =>
                                        lesson.students.map(student => {
                                          let age = null;
                                          if (student.birthDate) {
                                            age = differenceInYears(new Date(), new Date(student.birthDate));
                                          }
                                          return (
                                          <button
                                            key={`${lesson.id}-${student.id}`}
                                            onClick={() => {
                                              setSelectedStudent(student);
                                              setSelectedEnrollment({
                                                id: student.enrollmentId,
                                                readyForNextLevel: student.readyForNextLevel,
                                                classLevel: student.classLevel,
                                                strengthNotes: student.strengthNotes,
                                                improvementNotes: student.improvementNotes
                                              });
                                            }}
                                            className="block text-left w-full"
                                          >
                                              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative">
                                                <div className="flex items-center justify-between mb-2">
                                                  <div className="flex items-center">
                                                    <h2 className="text-xl font-semibold">
                                                      {student.name}
                                                      {age !== null && (
                                                        <span className="ml-2 text-gray-500 text-base">({age})</span>
                                                      )}
                                                    </h2>
                                                  </div>
                                                </div>
                                                <div className="flex items-center mt-1 mb-2 justify-between">
                                                <span 
                                                  className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                                                  style={{ backgroundColor: student.classLevel.color || "#3B82F6" }}
                                                >
                                                  {student.classLevel.name}
                                                </span>
                                                  {student.readyForNextLevel && (
                                                    <GraduationCap className="h-6 w-6 text-green-600 ml-2" />
                                                  )}
                                              </div>
                                              <div className="space-y-1">
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                  <div
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                                    style={{ width: `${(student.skills.filter(s => s.status === "COMPLETED").length / student.skills.length) * 100}%` }}
                                                  />
                                                </div>
                                                <div className="text-xs text-gray-500 text-right">
                                                  {student.skills.filter(s => s.status === "COMPLETED").length} of {student.skills.length} skills completed
                                                </div>
                                              </div>
                                            </div>
                                          </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
} 