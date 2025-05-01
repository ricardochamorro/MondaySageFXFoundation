'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/select';
import { TemplateEditor } from './template-editor';
import { MondayService } from '@/services/monday';

interface Group {
  id: string;
  name: string;
}

interface Board {
  id: string;
  name: string;
  columns: Column[];
}

interface Column {
  id: string;
  title: string;
  type: string;
}

interface TemplateMetadata {
  name: string;
  description: string;
  variables: string[];
}

export default function TemplatesPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMondayToken = async () => {
      try {
        const response = await fetch('/api/auth/monday/token', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to get Monday.com token');
        }
        const { accessToken } = await response.json();
        if (!accessToken) {
          throw new Error('No access token received');
        }
        return accessToken;
      } catch (err) {
        console.error('Error fetching Monday.com token:', err);
        throw err;
      }
    };

    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const accessToken = await fetchMondayToken();
        const mondayService = new MondayService(accessToken);
        const groupsData = await mondayService.getGroups();
        setGroups(groupsData);
      } catch (err) {
        console.error('Error fetching workspaces:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch workspaces. Please check your Monday.com connection and try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [router]);

  useEffect(() => {
    const fetchMondayToken = async () => {
      try {
        const response = await fetch('/api/auth/monday/token', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to get Monday.com token');
        }
        const { accessToken } = await response.json();
        if (!accessToken) {
          throw new Error('No access token received');
        }
        return accessToken;
      } catch (err) {
        console.error('Error fetching Monday.com token:', err);
        throw err;
      }
    };

    const fetchBoards = async () => {
      if (!selectedGroup) {
        setBoards([]);
        setColumns([]);
        return;
      }

      try {
        setError(null);
        const accessToken = await fetchMondayToken();
        const mondayService = new MondayService(accessToken);
        const boardsData = await mondayService.getBoards(selectedGroup);
        setBoards(boardsData);
      } catch (err) {
        console.error('Error fetching boards:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch boards. Please try again.');
      }
    };

    fetchBoards();
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedBoard) {
      const selectedBoardData = boards.find(board => board.id === selectedBoard);
      setColumns(selectedBoardData?.columns || []);
    } else {
      setColumns([]);
    }
  }, [selectedBoard, boards]);

  const handleSave = (template: { content: string; metadata: TemplateMetadata }) => {
    console.log('Template saved:', template);
    // TODO: Implement template saving logic
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="w-1/2">
          <Select
            value={selectedGroup}
            onValueChange={setSelectedGroup}
            placeholder="Select a workspace"
          >
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-1/2">
          <Select
            value={selectedBoard}
            onValueChange={setSelectedBoard}
            placeholder="Select a board"
            disabled={!selectedGroup}
          >
            {boards.map(board => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {columns.length > 0 && (
        <TemplateEditor
          columns={columns.map(col => ({
            id: col.id,
            name: col.title,
            type: col.type,
          }))}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
