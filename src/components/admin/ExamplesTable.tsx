import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, Music } from 'lucide-react';
import { ExampleForm } from './ExampleForm';
import { toast } from 'sonner';
import type { ExampleSession } from '@/hooks/useExampleSessions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const ExamplesTable = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExample, setSelectedExample] = useState<ExampleSession | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: examples, isLoading } = useQuery({
    queryKey: ['admin-examples'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('example_sessions')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as ExampleSession[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('example_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-examples'] });
      toast.success('Example deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const generateAudioMutation = useMutation({
    mutationFn: async (example: ExampleSession) => {
      const { data, error } = await supabase.functions.invoke('admin-generate-example', {
        body: { example },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-examples'] });
      toast.success('Audio generated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to generate audio: ${error.message}`);
    },
  });

  const handleEdit = (example: ExampleSession) => {
    setSelectedExample(example);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedExample(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading examples...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Example Sessions</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Example
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Audio</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {examples?.map((example) => (
              <TableRow key={example.id}>
                <TableCell className="font-medium">{example.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{example.session_type}</Badge>
                </TableCell>
                <TableCell>
                  {example.is_featured ? (
                    <Badge>Featured</Badge>
                  ) : (
                    <Badge variant="secondary">Hidden</Badge>
                  )}
                </TableCell>
                <TableCell>{example.display_order}</TableCell>
                <TableCell>
                  {example.audio_url ? (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateAudioMutation.mutate(example)}
                    disabled={generateAudioMutation.isPending}
                  >
                    <Music className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(example)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(example.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ExampleForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        example={selectedExample}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the example.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
