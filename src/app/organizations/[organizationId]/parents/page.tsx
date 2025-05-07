'use client';

import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button'

type Parent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  childrenCount: number;
  enrollmentsCount: number;
};

export default function OrganizationParentsPage({
  params: { organizationId },
}: {
  params: { organizationId: string };
}) {
  const [parents, setParents] = useState<Parent[]>([]);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [deletingParent, setDeletingParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Fetch parents when organizationId changes
  useEffect(() => {
    fetchParents();
  }, [organizationId]);

  const fetchParents = async () => {
    const res = await fetch(
      `/api/organizations/${organizationId}/parents`
    );
    if (res.ok) {
      setParents(await res.json());
    }
  };

  // Delete confirmation handler
  const handleDeleteConfirm = async () => {
    if (!deletingParent) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/parents/${deletingParent.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete parent');

      // Remove from state
      setParents((prev) =>
        prev.filter((p) => p.id !== deletingParent.id)
      );
      setDeletingParent(null);
    } catch (err) {
      console.error('Error deleting parent:', err);
    } finally {
      setLoading(false);
    }
  };

  // Edit save handler
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;

    setLoading(true);

    const res = await fetch(
      `/api/organizations/${organizationId}/parents`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingParent.id,
          name: nameRef.current!.value,
          email: emailRef.current!.value,
          phone: phoneRef.current!.value,
          password: passwordRef.current!.value,
        }),
      }
    );

    setLoading(false);

    if (res.ok) {
      setEditingParent(null);
      fetchParents();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to update parent');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Parents
          </h2>
          <p className="text-gray-600">
            Manage parents in this organization
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                # Children
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                # Enrollments
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parents.map((p, i) => (
              <tr
                key={p.id}
                className={
                  i % 2 === 0
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-gray-50 hover:bg-gray-100'
                }
              >
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {p.name}
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-gray-700">
                  {p.email}
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-gray-700">
                  {p.phone}
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-gray-700">
                  {p.childrenCount}
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-gray-700">
                  {p.enrollmentsCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => setEditingParent(p)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-indigo-50"
                    aria-label="Edit"
                  >
                    <Pencil className="h-5 w-5 text-indigo-600" />
                  </button>
                  <button
                    onClick={() => setDeletingParent(p)}
                    className="ml-2 inline-flex items-center justify-center h-8 w-8 rounded hover:bg-red-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Parent Dialog */}
      {editingParent && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && setEditingParent(null)}
        >
          <DialogContent onPointerDownOutside={() => setEditingParent(null)}>
            <DialogTitle>Edit Parent</DialogTitle>
            <form
              onSubmit={handleEditSave}
              className="space-y-4 pt-4"
            >
              {[
                {
                  label: 'Name',
                  ref: nameRef,
                  type: 'text',
                  defaultValue: editingParent.name,
                },
                {
                  label: 'Email',
                  ref: emailRef,
                  type: 'email',
                  defaultValue: editingParent.email,
                },
                {
                  label: 'Phone',
                  ref: phoneRef,
                  type: 'text',
                  defaultValue: editingParent.phone,
                },
                {
                  label: 'Password',
                  ref: passwordRef,
                  type: 'password',
                  placeholder: '••••••••',
                },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    ref={field.ref as any}
                    type={field.type}
                    defaultValue={(field as any).defaultValue}
                    placeholder={(field as any).placeholder}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
                  />
                  {field.label === 'Password' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Leave blank to keep current
                    </p>
                  )}
                </div>
              ))}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  onClick={() => setEditingParent(null)}
                  disabled={loading}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {loading ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Parent Dialog */}
      {deletingParent && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && setDeletingParent(null)}
        >
          <DialogContent onPointerDownOutside={() => setDeletingParent(null)}>
            <DialogTitle className="text-lg font-semibold text-red-600">Are you absolutely sure?</DialogTitle>
            <div className="pt-4">
              <p className="text-gray-700">
              This will permanently remove{" "}
                {deletingParent.name} as a
                parent from this organization. This action cannot be undone?
              </p>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  onClick={() => setDeletingParent(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}