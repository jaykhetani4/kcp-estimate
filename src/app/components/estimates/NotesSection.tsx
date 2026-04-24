import { Plus, X } from 'lucide-react';
import { Button } from '../common/Button';

export interface EstimateNote {
  id: string;
  note_text: string;
}

interface NotesSectionProps {
  notes: EstimateNote[];
  onChange: (notes: EstimateNote[]) => void;
}

export const NotesSection = ({ notes, onChange }: NotesSectionProps) => {
  const addNote = () => {
    const newNote: EstimateNote = {
      id: `note_${Date.now()}`,
      note_text: ''
    };
    onChange([...notes, newNote]);
  };

  const updateNote = (index: number, text: string) => {
    const newNotes = [...notes];
    newNotes[index] = { ...newNotes[index], note_text: text };
    onChange(newNotes);
  };

  const removeNote = (index: number) => {
    onChange(notes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Notes / Terms & Conditions</h3>
        <Button type="button" variant="outline" size="sm" onClick={addNote}>
          <Plus size={16} className="mr-2" />
          Add Note
        </Button>
      </div>

      {notes.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-3">No notes added</p>
          <Button type="button" variant="outline" size="sm" onClick={addNote}>
            <Plus size={16} className="mr-2" />
            Add Note
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {notes.map((note, index) => (
          <div key={note.id} className="flex gap-3">
            <div className="flex-1">
              <textarea
                value={note.note_text}
                onChange={e => updateNote(index, e.target.value)}
                placeholder={`Note ${index + 1}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                rows={3}
              />
            </div>
            <button
              type="button"
              onClick={() => removeNote(index)}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        ))}
      </div>

      {notes.length > 0 && notes.length < 20 && (
        <Button type="button" variant="outline" onClick={addNote} className="w-full">
          <Plus size={16} className="mr-2" />
          Add Another Note
        </Button>
      )}
    </div>
  );
};
