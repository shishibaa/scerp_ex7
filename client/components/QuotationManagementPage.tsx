"use client";

import { useEffect, useState } from "react";

type Quotation = {
  id: number;
  customerName: string;
  title: string;
  dueDate: string;
  type: string;
  status: string;
};

const emptyForm = {
  customerName: "",
  title: "",
  dueDate: "",
  type: "",
  status: "",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function QuotationManagementPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState<string>("");

  // ⭐ decode username from JWT
  const getUsernameFromToken = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username || "";
    } catch {
      return "";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // ================= LOAD DATA =================
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        setUsername(getUsernameFromToken(token));

        const res = await fetch(`${API_URL}/quotations`, {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await res.json();
        setQuotations(data);
      } catch {
        alert("Error loading quotations");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ================= FORM =================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.customerName.trim()) return "Customer name is required";
    if (!form.title.trim()) return "Title is required";
    if (!form.dueDate) return "Due date is required";
    if (!form.type) return "Type is required";
    if (!form.status) return "Status is required";
    return null;
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsOpen(true);
  };

  const openEditModal = (q: Quotation) => {
    setEditingId(q.id);
    setForm(q);
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const url =
        editingId === null
          ? `${API_URL}/quotations`
          : `${API_URL}/quotations/${editingId}`;

      const method = editingId === null ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();

      if (editingId === null) {
        setQuotations(prev => [...prev, data]);
      } else {
        setQuotations(prev =>
          prev.map(q => (q.id === editingId ? data : q))
        );
      }

      setIsOpen(false);
    } catch {
      alert("Failed to save quotation");
    } finally {
      setSaving(false);
    }
  };

  const deleteQuotation = async (id: number) => {
    if (!confirm("Delete this quotation?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/quotations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      setQuotations(prev => prev.filter(q => q.id !== id));
    } catch {
      alert("Failed to delete quotation");
    }
  };

  // ================= UI =================
  if (loading) {
    return (
      <div className="p-10 text-center text-lg font-medium">
        Loading quotations...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotation Management</h1>
          <p className="text-sm text-gray-500">Logged in as: {username}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleLogout}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Logout
          </button>

          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Quotation
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-center">Due Date</th>
              <th className="p-3 text-center">Type</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q.id} className="border-t">
                <td className="p-3">{q.customerName}</td>
                <td className="p-3">{q.title}</td>
                <td className="p-3 text-center">{q.dueDate}</td>
                <td className="p-3 text-center">{q.type}</td>
                <td className="p-3 text-center">{q.status}</td>
                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => openEditModal(q)}
                    className="px-3 py-1 bg-yellow-400 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteQuotation(q.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Edit Quotation" : "Add Quotation"}
            </h2>

            <input
              name="customerName"
              placeholder="Customer Name"
              value={form.customerName}
              onChange={handleChange}
              className="w-full border p-2 mb-3 rounded"
            />

            <input
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
              className="w-full border p-2 mb-3 rounded"
            />

            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className="w-full border p-2 mb-3 rounded"
            />

            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border p-2 mb-3 rounded"
            >
              <option value="">Select Type</option>
              <option value="Standard">Standard</option>
              <option value="Custom">Custom</option>
            </select>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border p-2 mb-4 rounded"
            >
              <option value="">Select Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}