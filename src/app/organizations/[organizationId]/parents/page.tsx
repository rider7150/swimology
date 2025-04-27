"use client";

import { useState, useEffect, useRef } from "react";
import { Pencil, Trash2 } from "lucide-react";

type Parent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  childrenCount: number;
  enrollmentsCount: number;
};

export default function OrganizationParentsPage({ params }: { params: { organizationId: string } }) {
  const [parents, setParents] = useState<Parent[]>([]);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [deletingParent, setDeletingParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const fetchParents = async () => {
    const res = await fetch(`/api/organizations/${params.organizationId}/parents`);
    if (res.ok) {
      const data = await res.json();
      setParents(data);
    }
  };

  useEffect(() => {
    fetchParents();
  }, [params.organizationId]);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    setLoading(true);
    const res = await fetch(`/api/organizations/${params.organizationId}/parents`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingParent.id,
        name: nameRef.current?.value,
        email: emailRef.current?.value,
        phone: phoneRef.current?.value,
        password: passwordRef.current?.value,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setEditingParent(null);
      fetchParents();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to update parent");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Parents</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Children</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Enrollments</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parents.map((parent) => (
              <tr key={parent.id}>
                <td className="px-6 py-4 whitespace-nowrap">{parent.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{parent.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{parent.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{parent.childrenCount}</td>
                <td className="px-6 py-4 whitespace-nowrap">{parent.enrollmentsCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    className="text-indigo-300 hover:text-blue-700 mr-2"
                    onClick={() => setEditingParent(parent)}
                  >
                    <Pencil className="inline h-5 w-5" />
                  </button>
                  <button
                    className="text-indigo-300 hover:text-red-700"
                    onClick={() => setDeletingParent(parent)}
                  >
                    <Trash2 className="inline h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Edit Parent Dialog (stub) */}
      {editingParent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Parent</h2>
            <form className="space-y-4" onSubmit={handleEditSave}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input ref={nameRef} className="mt-1 block w-full border rounded p-2" defaultValue={editingParent.name} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input ref={emailRef} className="mt-1 block w-full border rounded p-2" defaultValue={editingParent.email} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input ref={phoneRef} className="mt-1 block w-full border rounded p-2" defaultValue={editingParent.phone} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input ref={passwordRef} className="mt-1 block w-full border rounded p-2" type="password" placeholder="Set new password" />
                <p className="mt-1 text-xs text-gray-500">Leave blank to keep current password.</p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setEditingParent(null)} disabled={loading}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Parent Dialog (stub) */}
      {deletingParent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Delete Parent</h2>
            <p>Are you sure you want to delete {deletingParent.name}?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setDeletingParent(null)}>Cancel</button>
              <button type="button" className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 