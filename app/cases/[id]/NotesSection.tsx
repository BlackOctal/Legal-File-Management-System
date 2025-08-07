"use client";
import { useState, useEffect } from "react";
import { notesAPI } from "../../../lib/api";

interface NotesSectionProps {
  caseId: string;
  refreshTrigger?: number;
}

interface Note {
  _id: string;
  content: string;
  author: string;
  authorName: string;
  date: string;
  time: string;
  type: string;
  tags: string[];
  priority?: string;
  createdAt: string;
}

export default function NotesSection({
  caseId,
  refreshTrigger,
}: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [filter, setFilter] = useState("all");
  const [newNote, setNewNote] = useState({
    content: "",
    type: "Case Note",
    tags: "",
    priority: "Medium",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [caseId, refreshTrigger]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching notes for case:", caseId);
      const response = await notesAPI.getByCaseId(caseId);
      console.log("Notes API response:", response);

      const notesData = response.data?.notes || response.notes || [];
      setNotes(notesData);
      console.log("Notes loaded:", notesData);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setError("Failed to load notes");
      setNotes([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newNote.content.trim()) {
      alert("Note content is required");
      return;
    }

    setSubmitting(true);

    try {
      console.log("Creating note for case:", caseId);
      console.log("Note data:", newNote);

      const noteData = {
        content: newNote.content,
        type: newNote.type,
        tags: newNote.tags,
        priority: newNote.priority,
      };

      const response = await notesAPI.create(caseId, noteData);
      console.log("Note created successfully:", response);

      // Refresh notes list
      await fetchNotes();
      setNewNote({
        content: "",
        type: "Case Note",
        tags: "",
        priority: "Medium",
      });
      setShowAddNote(false);
      alert("Note added successfully!");
    } catch (error) {
      console.error("Error creating note:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create note";
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      await notesAPI.delete(noteId);
      await fetchNotes(); // Refresh notes list
      alert("Note deleted successfully!");
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Meeting Note":
        return "bg-blue-100 text-blue-800";
      case "Strategy Note":
        return "bg-purple-100 text-purple-800";
      case "Hearing Note":
        return "bg-green-100 text-green-800";
      case "Case Note":
        return "bg-gray-100 text-gray-800";
      case "Client Communication":
        return "bg-orange-100 text-orange-800";
      case "Internal Note":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Meeting Note":
        return "ri-group-line";
      case "Strategy Note":
        return "ri-lightbulb-line";
      case "Hearing Note":
        return "ri-calendar-line";
      case "Case Note":
        return "ri-file-text-line";
      case "Client Communication":
        return "ri-chat-3-line";
      case "Internal Note":
        return "ri-lock-line";
      default:
        return "ri-sticky-note-line";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
      case "Urgent":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid time";
    }
  };

  const filteredNotes = notes.filter((note) => {
    if (filter === "all") return true;
    return note.type.toLowerCase().replace(" ", "_") === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span className="text-gray-600">Loading notes...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Case Notes</h3>
        <div className="flex items-center space-x-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Notes</option>
            <option value="case_note">Case Notes</option>
            <option value="meeting_note">Meeting Notes</option>
            <option value="strategy_note">Strategy Notes</option>
            <option value="hearing_note">Hearing Notes</option>
            <option value="client_communication">Client Communication</option>
            <option value="internal_note">Internal Notes</option>
          </select>
          <button
            onClick={() => setShowAddNote(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer"
          >
            + Add Note
          </button>
        </div>
      </div>

      {error && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <i className="ri-error-warning-line text-2xl"></i>
          </div>
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchNotes}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="space-y-4">
        {filteredNotes.map((note) => (
          <div
            key={note._id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg">
                  <i className={`${getTypeIcon(note.type)} text-sm`}></i>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                      note.type
                    )}`}
                  >
                    {note.type}
                  </span>
                  {note.priority && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        note.priority
                      )}`}
                    >
                      {note.priority}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>{note.authorName || "Unknown Author"}</p>
                <p>
                  {formatDate(note.createdAt)} at {formatTime(note.createdAt)}
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-3">{note.content}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {note.tags &&
                  note.tags.length > 0 &&
                  note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // TODO: Implement edit note functionality
                    alert("Edit functionality coming soon");
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteNote(note._id)}
                  className="text-red-600 hover:text-red-700 text-sm cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && !loading && !error && (
        <div className="text-center py-8">
          <i className="ri-sticky-note-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600 mb-4">No notes found</p>
          <button
            onClick={() => setShowAddNote(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
          >
            Add First Note
          </button>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add New Note
                </h3>
                <button
                  onClick={() => setShowAddNote(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleAddNote} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      value={newNote.type}
                      onChange={(e) =>
                        setNewNote({ ...newNote, type: e.target.value })
                      }
                    >
                      <option value="Case Note">Case Note</option>
                      <option value="Meeting Note">Meeting Note</option>
                      <option value="Strategy Note">Strategy Note</option>
                      <option value="Hearing Note">Hearing Note</option>
                      <option value="Client Communication">
                        Client Communication
                      </option>
                      <option value="Internal Note">Internal Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      value={newNote.priority}
                      onChange={(e) =>
                        setNewNote({ ...newNote, priority: e.target.value })
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Content *
                  </label>
                  <textarea
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                    placeholder="Enter your note here..."
                    value={newNote.content}
                    onChange={(e) =>
                      setNewNote({ ...newNote, content: e.target.value })
                    }
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newNote.content.length}/1000 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. settlement, strategy, urgent"
                    value={newNote.tags}
                    onChange={(e) =>
                      setNewNote({ ...newNote, tags: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddNote(false)}
                    disabled={submitting}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Adding..." : "Add Note"}
                  </button>
                </div>
              </form>

              {/* Debug info */}
              <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
                <strong>Debug:</strong> Case ID: {caseId}, Notes count:{" "}
                {notes.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
