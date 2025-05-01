'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/select';
import { TemplateEditor } from './template-editor';
import { MondayService } from '@/services/monday';
import { Button } from '@mondaysagefx/ui';
import { useMondayAuth } from '@/hooks/useMondayAuth';

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

interface TemplateColumn {
  id: string;
  name: string;
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
  const [columns, setColumns] = useState<TemplateColumn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isMondayConnected, isLoading, connectToMonday } = useMondayAuth();

  const fetchMondayToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/auth/monday/token', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.redirected) {
          window.location.href = response.url;
          return;
        }
        const error = await response.json();
        if (error.message?.includes('No Monday.com account found')) {
          setError('Please connect your Monday.com account to continue');
          return;
        }
        throw new Error(error.message || 'Failed to get Monday.com token');
      }

      const data = await response.json();
      if (!data.access_token) {
        throw new Error('No access token received');
      }
      return data.access_token;
    } catch (err) {
      console.error('Error fetching Monday.com token:', err);
      throw err;
    }
  }, [router]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setError(null);
        const accessToken = await fetchMondayToken();
        if (!accessToken) return; // Early return if no token (error already set)
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
      }
    };

    fetchGroups();
  }, [fetchMondayToken]);

  useEffect(() => {
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
  }, [selectedGroup, fetchMondayToken]);

  useEffect(() => {
    if (selectedBoard) {
      const selectedBoardData = boards.find(board => board.id === selectedBoard);
      setColumns(
        selectedBoardData?.columns.map(col => ({
          id: col.id,
          name: col.title,
          type: col.type,
        })) || []
      );
    } else {
      setColumns([]);
    }
  }, [selectedBoard, boards]);

  const handleSave = (template: { content: string; metadata: TemplateMetadata }) => {
    console.log('Template saved:', template);
    // TODO: Implement template saving logic
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isMondayConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Connection Required</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>

          <div className="mt-8 space-y-4">
            <Button
              onClick={connectToMonday}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Connect Monday.com Account
            </Button>

            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="w-1/2">
          <div className="mb-2 text-sm font-medium text-gray-700">Workspace</div>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-1/2">
          <div className="mb-2 text-sm font-medium text-gray-700">Board</div>
          <Select value={selectedBoard} onValueChange={setSelectedBoard}>
            {boards.map(board => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <TemplateEditor columns={columns} onSave={handleSave} />
    </div>
  );
}
