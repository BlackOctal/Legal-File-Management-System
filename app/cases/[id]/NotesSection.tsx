
'use client';
import { useState } from 'react';

interface NotesSectionProps {
  caseId: string;
}

const mockNotes = [
  {
    id: '1',
    content: 'Client meeting scheduled for next week to discuss settlement options. Need to prepare financial analysis and potential negotiation strategies.',
    author: 'Sarah Johnson',
    date: '2024-12-15',
    time: '2:30 PM',
    type: 'Meeting Note',
    tags: ['settlement', 'client-meeting']
  },
  {
    id: '2',
    content: 'Opposing counsel has agreed to mediation. Mediator John Davis available on Jan 10th. Need to confirm with client and prepare mediation brief.',
    author: 'Mike Davis',
    date: '2024-12-10',
    time: '11:15 AM',
    type: 'Strategy Note',
    tags: ['mediation', 'strategy']
  },
  {
    id: '3',
    content: 'Documents received from client. Financial statements show significant discrepancies that need to be addressed. Schedule forensic accounting review.',
    author: 'Legal Assistant',
    date: '2024-12-05',
    time: '9:45 AM',
    type: 'Case Note',
    tags: ['documents', 'financial', 'review']
  },
  {
    id: '4',
    content: 'Pre-trial conference went well. Judge seems favorable to settlement. Opposing counsel indicated willingness to negotiate. Next steps: prepare settlement proposal.',
    author: 'Sarah Johnson',
    date: '2024-11-15',
    time: '4:20 PM',
    type: 'Hearing Note',
    tags: ['hearing', 'settlement', 'strategy']
  }
];

export default function NotesSection({ caseId }: NotesSectionProps) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'Case Note',
    tags: ''
  });
  const [filter, setFilter] = useState('all');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding note:', newNote);
    setNewNote({ content: '', type: 'Case Note', tags: '' });
    setShowAddNote(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Meeting Note': return 'bg-blue-100 text-blue-800';
      case 'Strategy Note': return 'bg-purple-100 text-purple-800';
      case 'Hearing Note': return 'bg-green-100 text-green-800';
      case 'Case Note': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Meeting Note': return 'ri-group-line';
      case 'Strategy Note': return 'ri-lightbulb-line';
      case 'Hearing Note': return 'ri-calendar-line';
      case 'Case Note': return 'ri-file-text-line';
      default: return 'ri-sticky-note-line';
    }
  };

  const filteredNotes = mockNotes.filter(note => {
    if (filter === 'all') return true;
    return note.type.toLowerCase().replace(' ', '_') === filter;
  });

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
          </select>
          <button
            onClick={() => setShowAddNote(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer"
          >
            + Add Note
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotes.map((note) => (
          <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg">
                  <i className={`${getTypeIcon(note.type)} text-sm`}></i>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(note.type)}`}>
                    {note.type}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>{note.author}</p>
                <p>{note.date} at {note.time}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-3">{note.content}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {note.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer">
                  Edit
                </button>
                <button className="text-red-600 hover:text-red-700 text-sm cursor-pointer">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-8">
          <i className="ri-sticky-note-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No notes found</p>
        </div>
      )}

      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add New Note</h3>
                <button
                  onClick={() => setShowAddNote(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                    value={newNote.type}
                    onChange={(e) => setNewNote({...newNote, type: e.target.value})}
                  >
                    <option value="Case Note">Case Note</option>
                    <option value="Meeting Note">Meeting Note</option>
                    <option value="Strategy Note">Strategy Note</option>
                    <option value="Hearing Note">Hearing Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note Content</label>
                  <textarea
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                    placeholder="Enter your note here..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{newNote.content.length}/500 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. settlement, strategy, urgent"
                    value={newNote.tags}
                    onChange={(e) => setNewNote({...newNote, tags: e.target.value})}
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddNote(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200 whitespace-nowrap cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 whitespace-nowrap cursor-pointer"
                  >
                    Add Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
