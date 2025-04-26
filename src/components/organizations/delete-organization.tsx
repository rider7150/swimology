'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
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
    <div className="fixed bottom-4 right-4">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <Button 
            variant="destructive" 
            size="sm"
            className="flex items-center gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <Dialog.Title className="text-lg font-semibold text-red-600">
              Delete Organization
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete {organizationName}? This action cannot be undone.
              All associated data including admins, instructors, class levels, and lessons will be permanently deleted.
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button variant="outline">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Organization'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
} 