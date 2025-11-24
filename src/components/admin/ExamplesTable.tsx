import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from('example_sessions')
        .update({ is_featured })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-examples'] });
      toast.success('Estado actualizado');
    },
    onError: (error) => {
      toast.error(`Error al actualizar: ${error.message}`);
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

  const filteredExamples = useMemo(() => {
    if (!examples) return { all: [], published: [], drafts: [], pending: [] };
    
    return {
      all: examples,
      published: examples.filter(e => e.is_featured && e.audio_url),
      drafts: examples.filter(e => !e.is_featured),
      pending: examples.filter(e => !e.audio_url),
    };
  }, [examples]);

  if (isLoading) {
    return <div className="text-center py-8">Loading examples...</div>;
  }

  const renderTable = (data: ExampleSession[]) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Publicado</TableHead>
            <TableHead>Order</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No hay ejemplos en esta categoría
              </TableCell>
            </TableRow>
          ) : (
            data.map((example) => (
              <TableRow key={example.id}>
                <TableCell className="font-medium">{example.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{example.session_type}</Badge>
                </TableCell>
                <TableCell>
                  {example.audio_url ? (
                    example.is_featured ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        Publicado
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                        Borrador
                      </Badge>
                    )
                  ) : (
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                      Sin Audio
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-block">
                          <Switch
                            checked={example.is_featured}
                            onCheckedChange={(checked) => 
                              toggleFeaturedMutation.mutate({ 
                                id: example.id, 
                                is_featured: checked 
                              })
                            }
                            disabled={!example.audio_url || toggleFeaturedMutation.isPending}
                          />
                        </div>
                      </TooltipTrigger>
                      {!example.audio_url && (
                        <TooltipContent>
                          <p>Genera el audio primero para poder publicar</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>{example.display_order}</TableCell>
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Example Sessions</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Example
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({filteredExamples.all.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Publicados ({filteredExamples.published.length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Borradores ({filteredExamples.drafts.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Sin Audio ({filteredExamples.pending.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {renderTable(filteredExamples.all)}
        </TabsContent>
        
        <TabsContent value="published" className="mt-4">
          {renderTable(filteredExamples.published)}
        </TabsContent>
        
        <TabsContent value="drafts" className="mt-4">
          {renderTable(filteredExamples.drafts)}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4">
          {renderTable(filteredExamples.pending)}
        </TabsContent>
      </Tabs>

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
