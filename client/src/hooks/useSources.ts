import { useState, useCallback } from 'react';
import { Source } from '../types/source';
import { sourceAPI } from '../services/api';

export const useSources = (workspaceId: string) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sources list
  const fetchSources = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await sourceAPI.list(workspaceId);
      setSources(data);
    } catch (err: any) {
      console.error('Error fetching sources:', err);
      setError(err.response?.data?.error || 'Failed to load sources list.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Upload file
  const uploadFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const newSource = await sourceAPI.uploadFile(workspaceId, file);
      setSources(prev => [newSource, ...prev]);
      return newSource;
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const msg = err.response?.data?.error || 'Failed to upload document.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Upload pasted text source
  const uploadPastedText = useCallback(async (title: string, text: string) => {
    setLoading(true);
    setError(null);
    try {
      const newSource = await sourceAPI.uploadPastedText(workspaceId, title, text);
      setSources(prev => [newSource, ...prev]);
      return newSource;
    } catch (err: any) {
      console.error('Error uploading text:', err);
      const msg = err.response?.data?.error || 'Failed to save notes.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Delete source document
  const deleteSource = useCallback(async (id: string) => {
    setError(null);
    try {
      await sourceAPI.delete(id);
      setSources(prev => prev.filter(src => src._id !== id));
    } catch (err: any) {
      console.error('Error deleting source:', err);
      setError(err.response?.data?.error || 'Failed to remove source document.');
    }
  }, []);

  // Rename source document
  const renameSource = useCallback(async (id: string, newName: string) => {
    setError(null);
    try {
      const updated = await sourceAPI.rename(id, newName);
      setSources(prev => prev.map(src => src._id === id ? updated : src));
      return updated;
    } catch (err: any) {
      console.error('Error renaming source:', err);
      setError(err.response?.data?.error || 'Failed to rename source document.');
      throw err;
    }
  }, []);

  return {
    sources,
    loading,
    error,
    fetchSources,
    uploadFile,
    uploadPastedText,
    deleteSource,
    renameSource,
    setSources
  };
};
