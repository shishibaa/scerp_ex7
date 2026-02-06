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

export default function QuotationManagementPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/quotations")
      .then(res => res.json())
      .then(data => setQuotations(data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

// Modal
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
    if (editingId === null) {
      const res = await fetch("http://localhost:3000/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const newQ = await res.json();
      setQuotations([...quotations, newQ]);
    } else {
      const res = await fetch(
        `http://localhost:3000/quotations/${editingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const updated = await res.json();
      setQuotations(
        quotations.map(q => (q.id === editingId ? updated : q))
      );
    }

    setIsOpen(false);
  };

  const deleteQuotation = async (id: number) => {
    await fetch(`http://localhost:3000/quotations/${id}`, {
      method: "DELETE",
    });
    setQuotations(quotations.filter(q => q.id !== id));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quotation Management</h1>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Quotation
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3">Due Date</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
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

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Edit Quotation" : "Add Quotation"}
            </h2>

            {["customerName", "title", "type", "status"].map(field => (
              <input
                key={field}
                name={field}
                placeholder={field}
                value={(form as any)[field]}
                onChange={handleChange}
                className="w-full border p-2 mb-3 rounded"
              />
            ))}

            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className="w-full border p-2 mb-4 rounded"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {editingId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
