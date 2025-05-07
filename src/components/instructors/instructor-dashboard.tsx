"use client";

import { useState, useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle, Clock, MoreHorizontal, GraduationCap } from "lucide-react";
import { differenceInYears, format, getDay, getMonth } from "date-fns";

interface Skill {
  id: string;
  name: string;
  description?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  notes?: string;
  strengthNotes?: string;
  improvementNotes?: string;
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
  birthDate: string;
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
  progress: number;
  skills?: Skill[];
  strengthNotes?: string;
  improvementNotes?: string;
  enrollmentId: string;
  students: Student[];
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
  //console.log('Initial Lessons:', JSON.stringify(initialLessons, null, 2));

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
  const [nextLevelColor, setNextLevelColor] = useState<string>("");
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

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  
  //const [_, setForceUpdate] = useState(0);

  //useEffect(() => {
   // console.log('whats herelessons');
   // setForceUpdate(f => f + 1);
  //}, [lessons]);

  const skillsSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Call refreshLessons on initial load
    //console.log('refreshing lessons');
    refreshLessons();
}, []); // Empty dependency array means this runs once on mount

  // Helper function to format time
  const formatTime = (time: string) => {
    if (!time) return '';
    //console.log('time', time);
 
    try {
      const date = new Date(time);
      //console.log('date', date);   
      
      if (isNaN(date.getTime())) {
        //console.log('Invalid date object');
        return time;
      }
      // Format in 12-hour time
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Los_Angeles'  // Use Pacific time since that's what we're seeing
      });

 
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

  // Helper function to safely format date
  const formatDate = (dateString: string, formatStr: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, formatStr);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Group lessons by month, day, and time
  const groupedLessons = lessons.reduce((acc, lesson) => {
    const startDate = new Date(lesson.startDate);
    const month = startDate.getMonth() + 1;
    const year = startDate.getFullYear();
    
    const monthStr = month.toString().padStart(2, '0');
    const monthKey = `${year}-${monthStr}`;
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
   // console.log('refreshing lessons');
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
            console.log(data);
            setNextLevelName(data.name);
            setNextLevelColor(data.color);
          } else {
            setNextLevelName ("");
            setNextLevelColor ("");
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
        setSelectedLesson(null);
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
      setTimeout(() => {
        if (skillsSectionRef.current) {
          skillsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
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

  // Add a card click toggle function
  const handleCardClick = (student: Student, lesson: Lesson) => {
    if (selectedLesson?.enrollmentId === student.enrollmentId) {
      setSelectedStudent(null);
      setSelectedLesson(null);
    } else {
      setSelectedStudent(student);
      setSelectedLesson(lesson);
      setTimeout(() => {
        if (skillsSectionRef.current) {
          skillsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100); // allow render
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
      </div>

      {/* Cards Grid */}
      {lessons.length === 0 ? (
        <p className="text-gray-500">No lessons found.</p>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            lesson.students && lesson.students.length > 0 && lesson.students.map((student) => {
              const personalizedLesson = {
                ...lesson,
                skills: student.skills,
                strengthNotes: student.strengthNotes,
                improvementNotes: student.improvementNotes,
                enrollmentId: student.enrollmentId,
              };
              return (
                <div key={`${lesson.id}-${student.id}`}>
                  <div
                    onClick={() => handleCardClick(student, personalizedLesson)}
                    className={`bg-white border border-gray-200 rounded-lg p-4 shadow transition hover:shadow-lg cursor-pointer ${
                      selectedLesson?.enrollmentId === student.enrollmentId ? "ring-2 ring-indigo-400" : ""
                    }`}
                  >
                    {/* Lesson Details at the top */}
                    <div className="mb-2 text-xs text-gray-500 font-normal">
                      {formatDate(lesson.startTime, 'MMMM yyyy')} • {getDayName(lesson.dayOfWeek)}s • {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                    </div>

                    <div className="flex justify-between items-center mb-2">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold text-white "
                        style={{ backgroundColor: lesson.classLevel.color || "#3b82f6" }}
                      >
                        {lesson.classLevel.name}
                      </span>
                      <div className="flex space-x-2">
                        {student.readyForNextLevel && (
                          <GraduationCap className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-xl font-semibold">{student.name}</span>
                      {student.birthDate && (
                        <span className="text-gray-500">
                          ({differenceInYears(new Date(), new Date(student.birthDate))})
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all" 
                          style={{ 
                            width: `${(student.skills.filter(s => s.status === "COMPLETED").length / student.skills.length) * 100}%` 
                          }} 
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-right mt-1">
                        {student.skills.filter(s => s.status === "COMPLETED").length} of {student.skills.length} skills completed
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ))}
        </div>
      )}

      {/* Student Card */}
      {selectedStudent && selectedLesson && (
        <div ref={skillsSectionRef} className="mt-6 bg-white p-6 rounded-lg shadow border">
          {/* Lesson time/day at the top */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
            <div className="mt-2 text-xs text-gray-500 font-normal">
              {formatDate(selectedLesson.startTime, 'MMMM yyyy')}<span className="inline-block w-2" /> {/* space */}
              {getDayName(selectedLesson.dayOfWeek)}s • {formatTime(selectedLesson.startTime)} - {formatTime(selectedLesson.endTime)}

            </div>
            {nextLevelName && (
              <span className="hidden sm:inline-flex items-center space-x-2">
                                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold text-white "
                        style={{ backgroundColor: nextLevelColor || "#3b82f6" }}
                      >
                  {nextLevelName}
                </span>
                <Switch
                  id="ready-toggle"
                  checked={draftState.readyForNextLevel}
                  onCheckedChange={handleReadyToggle}
                  className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-200"
                />
              </span>
            )}
          </div>
          {/* Skills for student title and badge for mobile */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
            <h2 className="text-xl font-semibold">
              Skills for {selectedStudent.name}
              {selectedStudent.birthDate && (
                <span className="ml-2 text-gray-500 text-base">
                  ({differenceInYears(new Date(), new Date(selectedStudent.birthDate))})
                </span>
              )}
            </h2>
            {/* Next Level badge and switch for mobile */}
            {nextLevelName && (
              <span className="sm:hidden inline-flex flex-col items-start mt-2 space-y-1">
                <span className="rounded-full px-3 py-1 text-xs font-semibold text-white bg-indigo-500">
                  {nextLevelName}
                </span>
                <span className="flex items-center space-x-2 mt-1">
                  <span className="text-sm font-medium text-gray-700">Ready for next level</span>
                  <Switch
                    id="ready-toggle-mobile"
                    checked={draftState.readyForNextLevel}
                    onCheckedChange={handleReadyToggle}
                    className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-200"
                  />
                </span>
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedLesson.skills?.map((skill: Skill) => (
                  <tr key={skill.id}>
                    <td className="px-4 py-2 font-medium text-gray-900 align-top">
                      <div>{skill.name}</div>
                      {/* Only show description on desktop */}
                      {skill.description && (
                        <div className="text-xs text-gray-500 mt-1 hidden sm:block">{skill.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <div className="flex space-x-2">
                        {(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as Skill["status"][]).map((st) => (
                          <button
                            key={st}
                            disabled={updatingSkill}
                            onClick={() => handleStatusChange(skill.id, st)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200 border text-lg ${
                              draftState.skills[skill.id] === st
                                ? getStatusColor(st) + " border-blue-500"
                                : "bg-gray-200 text-gray-400 hover:bg-gray-100 border-gray-300"
                            }`}
                            title={st.replace("_", " ")}
                          >
                            {getStatusIcon(st)}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top hidden sm:table-cell">
                      <textarea
                        id={`skill-notes-${skill.id}`}
                        className="w-full rounded-md border border-gray-300 p-1 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        rows={2}
                        placeholder="Add notes..."
                        value={draftState.skillNotes[skill.id] || ""}
                        onChange={e => setDraftState(prev => ({
                          ...prev,
                          skillNotes: { ...prev.skillNotes, [skill.id]: e.target.value }
                        }))}
                        disabled={updatingSkill}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Overall lesson notes */}
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
                    disabled={updatingSkill}
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
                    disabled={updatingSkill}
                  />
                </div>
              </div>
            </div>
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
        </div>
      )}
    </div>
  );
} 