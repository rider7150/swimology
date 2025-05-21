'use client';

import { useState, useEffect } from 'react';
import { ParentChildren } from "@/components/parents/parent-children";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ParentDetailsPageProps {
  params: {
    organizationId: string;
    parentId: string;
  };
}

export default function ParentDetailsPage({ params }: ParentDetailsPageProps) {
  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParent = async () => {
      try {
        const response = await fetch(`/api/organizations/${params.organizationId}/parents/${params.parentId}`);
        if (!response.ok) throw new Error('Failed to fetch parent details');
        const data = await response.json();
        setParent(data);
      } catch (error) {
        console.error('Error fetching parent:', error);
        toast.error('Failed to load parent details');
      } finally {
        setLoading(false);
      }
    };

    fetchParent();
  }, [params.organizationId, params.parentId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Parent Not Found</h1>
          <p className="text-gray-600 mb-4">The parent you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Parent Details</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-medium text-gray-500">Name</h2>
              <p className="mt-1 text-lg">{parent.name}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Email</h2>
              <p className="mt-1 text-lg">{parent.email}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Phone</h2>
              <p className="mt-1 text-lg">{parent.phone}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <ParentChildren
          parentId={params.parentId}
          organizationId={params.organizationId}
        />
      </div>
    </div>
  );
} 