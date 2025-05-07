'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TrashIcon } from '@heroicons/react/24/outline';

interface DeleteOrganizationProps {
  organizationId: string;
  organizationName: string;
}

export function DeleteOrganization({ organizationId, organizationName }: DeleteOrganizationProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }

      toast.success('Organization deleted successfully');
      
      router.push('/organizations');
    } catch (error) {
      toast.error('Failed to delete organization');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete Organization
        </Button>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50" />
        <DialogContent
          className="fixed left-1/2 top-1/2 
                     -translate-x-1/2 -translate-y-1/2 
                     bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
          aria-describedby="delete-org-description"
        >
          <DialogTitle className="text-lg font-semibold text-red-600">
            Are you absolutely sure?
          </DialogTitle>

          <DialogDescription
            id="delete-org-description"
            className="mt-2 text-sm text-gray-500"
          >
            Are you sure you want to delete <strong>{organizationName}</strong>?{' '}
            This action cannot be undone. All associated data including admins,
            instructors, class levels, and lessons will be permanently deleted.
          </DialogDescription>

          <div className="mt-6 flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Organization'}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
} 