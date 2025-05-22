'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from "next/link";
import { ParentChildren } from "@/components/parents/parent-children";
import React from 'react';

type Parent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  childrenCount: number;
  enrollmentsCount: number;
  children: Array<{
    id: string;
    name: string;
    birthDate: string;
    enrollments: Array<{
      id: string;
      lessonId: string;
      childId: string;
    }>;
  }>;
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
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);

  // Form state for editing
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

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

  // Populate form when editingParent changes
  useEffect(() => {
    if (editingParent) {
      setForm({
        name: editingParent.name ?? '',
        email: editingParent.email ?? '',
        phone: editingParent.phone ?? '',
        password: '',
      });
    }
  }, [editingParent]);

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

    const payload: Record<string, string> = {
      name: form.name,
      email: form.email,
      phone: form.phone,
    };
    if (form.password) {
      payload.password = form.password;
    }

    const res = await fetch(
      `/api/organizations/${organizationId}/parents`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingParent.id, ...payload }),
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleExpand = (parentId: string) => {
    setExpandedParentId(expandedParentId === parentId ? null : parentId);
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-6 py-3"></th>
                <th className="pl-0 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <th className="w-24 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parents.map((p, i) => (
                <React.Fragment key={p.id}>
                  <tr
                    className={
                      i % 2 === 0
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }
                  >
                    <td className="pl-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleExpand(p.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedParentId === p.id ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="pl-0 py-4 whitespace-nowrap">
                      <div className="text-blue-600 hover:text-blue-900">
                        {p.name}
                      </div>
                      <div className="md:hidden text-sm text-gray-500 mt-1">
                        {p.email}
                      </div>
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
                    <td className="pr-4 py-4 whitespace-nowrap text-left">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingParent(p)}
                          className="inline-flex items-center justify-center rounded px-2 hover:text-indigo-600 text-indigo-300"
                          aria-label="Edit"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeletingParent(p)}
                          className="inline-flex items-center justify-center rounded px-2 hover:text-red-600 text-indigo-300"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedParentId === p.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="pl-6">
                          <ParentChildren
                            parentId={p.id}
                            organizationId={organizationId}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Parent Dialog */}
      {editingParent && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && setEditingParent(null)}
        >
          <DialogContent 
            className="sm:max-w-[425px]"
            aria-describedby="edit-parent-description"
          >
            <DialogTitle>Edit Parent</DialogTitle>
            <DialogDescription id="edit-parent-description">
              Update the parent's information. Leave the password field blank to keep the current password.
            </DialogDescription>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                    className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>

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
          <DialogContent 
            className="sm:max-w-[425px]"
            aria-describedby="delete-parent-description"
          >
            <DialogTitle className="text-lg font-semibold text-red-600">
              Are you absolutely sure?
            </DialogTitle>
            <DialogDescription id="delete-parent-description">
              This will permanently remove {deletingParent.name} as a parent from this organization. This action cannot be undone.
            </DialogDescription>
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
