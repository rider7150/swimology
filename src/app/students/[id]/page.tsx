"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle, Clock, MoreHorizontal } from "lucide-react";
import { useParams } from "next/navigation";

interface Skill {
  id: string;
  name: string;
  description: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  strengthNotes?: string;
  improvementNotes?: string;
}

interface ClassLevel {
  id: string;
  name: string;
  sortOrder: number;
}

interface StudentData {
  id: string;
  name: string;
  enrollmentId: string;
  classLevel: ClassLevel;
  readyForNextLevel: boolean;
  skills: Skill[];
}

export default function StudentProgressPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [nextLevelName, setNextLevelName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingSkill, setUpdatingSkill] = useState(false);

  const fetchNextLevel = async (classLevelId: string) => {
    try {
      const response = await fetch(`/api/class-levels/next/${classLevelId}`);
      const data = await response.json();
      if (response.ok && data.name) {
        setNextLevelName(data.name);
      } else {
        setNextLevelName(null);
      }
    } catch (error) {
      console.error('Error fetching next level:', error);
      setNextLevelName(null);
    }
  };

  const fetchStudentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/students/${params.id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error('Failed to fetch student data');
      }
      console.log('Student data:', data);
      console.log('Skills data:', data.skills);
      setStudent(data);
      
      if (data.classLevel?.id) {
        await fetchNextLevel(data.classLevel.id);
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.id, toast, fetchNextLevel]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleReadyToggle = async (checked: boolean) => {
    try {
      const response = await fetch(`/api/enrollments/${student!.enrollmentId}/ready`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ready: checked }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ready status');
      }

      await fetchStudentData();
      
      toast({
        title: "Success",
        description: `Student ${checked ? 'is now' : 'is no longer'} marked as ready for the next level`,
      });
    } catch (error) {
      console.error('Error updating ready status:', error);
      toast({
        title: "Error",
        description: "Failed to update ready status",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    skillId: string,
    newStatus: Skill["status"],
    strengthNotes?: string,
    improvementNotes?: string
  ) => {
    try {
      setUpdatingSkill(true);
      const response = await fetch("/api/skills/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skillId,
          enrollmentId: student!.enrollmentId,
          status: newStatus,
          strengthNotes,
          improvementNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update skill status');
      }

      await fetchStudentData();
      
      toast({
        title: "Success",
        description: "Skill status updated successfully",
      });
    } catch (error) {
      console.error('Error updating skill status:', error);
      toast({
        title: "Error",
        description: "Failed to update skill status",
        variant: "destructive",
      });
    } finally {
      setUpdatingSkill(false);
    }
  };

  const getStatusColor = (status: Skill["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 hover:bg-green-200 text-green-600";
      case "IN_PROGRESS":
        return "bg-yellow-100 hover:bg-yellow-200 text-yellow-600";
      default:
        return "bg-gray-100 hover:bg-gray-200 text-gray-600";
    }
  };

  const getStatusIcon = (status: Skill["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      default:
        return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Student not found</h2>
        </div>
      </div>
    );
  }

  const completedSkills = student.skills.filter(s => s.status === "COMPLETED").length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Back to Lessons
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {student.name} - {student.classLevel.name}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {completedSkills} of {student.skills.length} skills completed
              </div>
              {student.readyForNextLevel === true && nextLevelName && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  <span>Ready for {nextLevelName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {student.skills.map((skill) => {
              console.log('Rendering skill:', skill);
              return (
                <div
                  key={skill.id}
                  className="relative rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {skill.name}
                    </h3>
                    {skill.description && (
                      <p className="text-sm text-gray-500">{skill.description}</p>
                    )}
                    <div className="flex space-x-2">
                      {["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].map((status) => (
                        <button
                          key={status}
                          disabled={updatingSkill}
                          onClick={() => handleStatusChange(skill.id, status as Skill["status"], skill.strengthNotes, skill.improvementNotes)}
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            skill.status === status
                              ? getStatusColor(status as Skill["status"])
                              : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          }`}
                          title={status.replace("_", " ")}
                        >
                          {getStatusIcon(status as Skill["status"])}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label htmlFor={`strength-${skill.id}`} className="block text-sm font-medium text-green-700">
                          I'm Awesome At:
                        </label>
                        <div className="mt-1">
                          <textarea
                            id={`strength-${skill.id}`}
                            rows={2}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm bg-green-50"
                            placeholder="Add notes about strengths..."
                            value={skill.strengthNotes || ""}
                            onChange={(e) => handleStatusChange(skill.id, skill.status, e.target.value, skill.improvementNotes)}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor={`improvement-${skill.id}`} className="block text-sm font-medium text-blue-700">
                          I Can Improve On:
                        </label>
                        <div className="mt-1">
                          <textarea
                            id={`improvement-${skill.id}`}
                            rows={2}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-blue-50"
                            placeholder="Add notes about areas for improvement..."
                            value={skill.improvementNotes || ""}
                            onChange={(e) => handleStatusChange(skill.id, skill.status, skill.strengthNotes, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 