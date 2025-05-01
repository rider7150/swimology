"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { EditInstructorDialog } from "./edit-instructor-dialog";
import { EditLessonDialog } from "@/components/lessons/edit-lesson-dialog";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface ClassLevel {
  id: string;
  name: string;
}

interface Lesson {
  id: string;
  classLevelId: string;
  month: number;
  year: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  color: string;
  classLevel: {
    id: string;
    name: string;
  };
}

interface Instructor {
  id: string;
  organizationId: string;
  userId: string;
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

function formatTime(time: string) {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

export function InstructorList({ organizationId, instructors, classLevels }: InstructorListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Group lessons by month
  const groupLessonsByMonth = (lessons: Lesson[]) => {
    const grouped = lessons.reduce((acc, lesson) => {
      const monthKey = `${months[lesson.month - 1]} ${lesson.year}`;
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(lesson);
      return acc;
    }, {} as Record<string, Lesson[]>);

    // Sort lessons within each month by day and time
    Object.keys(grouped).forEach(month => {
      grouped[month].sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) {
          return a.dayOfWeek - b.dayOfWeek;
        }
        return a.startTime.localeCompare(b.startTime);
      });
    });

    return grouped;
  };

  const handleDeleteInstructor = async (instructorId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/instructors/${instructorId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete instructor");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete instructor");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/lessons/${lessonId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete lesson");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete lesson");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString || typeof timeString !== 'string') {
      //console.log('Invalid time string:', timeString);
      return '';
    }
    
    try {
      //console.log('Raw time string:', timeString);
      
      // Convert the date string back to a Date object
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        //console.log('Invalid date object');
        return timeString;
      }
      
      // Format in 12-hour time
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Los_Angeles'  // Use Pacific time since that's what we're seeing
      });
    } catch (error) {
      //console.error('Error formatting time:', error, 'timeString:', timeString);
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return '';
    
    try {
      // For dates, we want to parse them in local time to avoid timezone shifts
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(new Date(date.toISOString()));
    } catch (error) {
      //console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {instructors.length === 0 ? (
            <p className="text-sm text-gray-500">No instructors added yet.</p>
          ) : (
            <div className="space-y-6">
              {instructors.map((instructor) => {
                const lessonsByMonth = groupLessonsByMonth(instructor.lessons);
                return (
                  <div
                    key={instructor.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{instructor.user.name || 'Unnamed Instructor'}</h4>
                        <p className="text-sm text-gray-500">
                          {instructor.user.email}
                        </p>
                        {instructor.phoneNumber && (
                          <p className="text-sm text-gray-500">
                            {instructor.phoneNumber}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <EditInstructorDialog
                          organizationId={organizationId}
                          instructor={{
                            id: instructor.id,
                            userId: instructor.userId,
                            phoneNumber: instructor.phoneNumber,
                            user: {
                              name: instructor.user.name || 'Unnamed Instructor',
                              email: instructor.user.email
                            }
                          }}
                        />
                        <DeleteConfirmationDialog
                          onDelete={() => handleDeleteInstructor(instructor.id)}
                          isDeleting={loading}
                          itemType="instructor"
                          itemName={instructor.user.name || 'Unnamed Instructor'}
                        />
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2">Assigned Lessons</h5>
                      {instructor.lessons.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No lessons assigned yet.
                        </p>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(lessonsByMonth).map(([month, lessons]) => (
                            <div key={month} className="space-y-2">
                              <h6 className="text-sm font-medium text-gray-700">{month}</h6>
                              <ul className="space-y-2">
                                {lessons.map((lesson) => (
                                  <li key={lesson.id} className="py-3 flex justify-between items-center">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {lesson.classLevel.name}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {days[lesson.dayOfWeek]} at {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <EditLessonDialog
                                        organizationId={organizationId}
                                        classLevels={classLevels}
                                        instructors={instructors.map(i => ({
                                          id: i.id,
                                          user: {
                                            name: i.user.name || 'Unnamed Instructor'
                                          }
                                        }))}
                                        lesson={{
                                          id: lesson.id,
                                          classLevelId: lesson.classLevelId,
                                          instructorId: instructor.id,
                                          month: lesson.month,
                                          year: lesson.year,
                                          dayOfWeek: lesson.dayOfWeek,
                                          startTime: lesson.startTime,
                                          endTime: lesson.endTime
                                        }}
                                      />
                                      <DeleteConfirmationDialog
                                        onDelete={() => handleDeleteLesson(lesson.id)}
                                        isDeleting={loading}
                                        itemType="lesson"
                                        itemName={instructor.user.name || 'Unnamed Instructor'}
                                      />
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 