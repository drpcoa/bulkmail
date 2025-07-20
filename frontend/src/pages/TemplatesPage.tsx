import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Alert,
} from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
} from '@mui/icons-material';

interface Template {
  id: string;
  name: string;
  subject: string;
  text: string;
  html?: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  name: string;
  subject: string;
  text: string;
  html: string;
}

const TemplatesPage = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as AlertColor,
  });

  const { control, handleSubmit, reset, setValue } = useForm<TemplateFormData>({
    defaultValues: {
      name: '',
      subject: '',
      text: '',
      html: '',
    },
  });

  // Fetch templates
  const { data: templates = [], isPending, error } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await axios.get('/api/templates');
      return data;
    },
  });

  const createTemplate = useMutation({
    mutationFn: (data: TemplateFormData) => 
      axios.post('/api/templates', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setOpenDialog(false);
      setSnackbar({ 
        open: true, 
        message: 'Template created successfully', 
        severity: 'success' 
      });
      reset();
    },
    onError: (error: any) => {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to create template', 
        severity: 'error' 
      });
    }
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: string, data: TemplateFormData }) => 
      axios.put(`/api/templates/${id}`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setOpenDialog(false);
      setSnackbar({ 
        open: true, 
        message: 'Template updated successfully', 
        severity: 'success' 
      });
      reset();
    },
    onError: (error: any) => {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to update template', 
        severity: 'error' 
      });
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => 
      axios.delete(`/api/templates/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSnackbar({ 
        open: true, 
        message: 'Template deleted successfully', 
        severity: 'success' 
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to delete template', 
        severity: 'error' 
      });
    }
  });

  const handleOpenDialog = (template: Template | null = null) => {
    setEditingTemplate(template);
    if (template) {
      setValue('name', template.name);
      setValue('subject', template.subject);
      setValue('text', template.text);
      setValue('html', template.html || '');
    } else {
      reset({
        name: '',
        subject: '',
        text: '',
        html: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemplate(null);
    reset();
  };

  const handleFormSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateTemplate.mutate({ 
        id: editingTemplate.id, 
        data 
      });
    } else {
      createTemplate.mutate(data);
    }
  };

  const handleDelete = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete);
      setTemplateToDelete(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Email Templates
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Template
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        {isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">
            Error loading templates: {error.message}
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>{template.subject}</TableCell>
                    <TableCell>
                      {new Date(template.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleOpenDialog(template)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setTemplateToDelete(template.id);
                          setDeleteDialogOpen(true);
                        }}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogTitle>
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    autoFocus
                    margin="dense"
                    label="Template Name"
                    fullWidth
                    variant="outlined"
                    error={!!error}
                    helperText={error?.message}
                    sx={{ mb: 2 }}
                  />
                )}
              />
              
              <Controller
                name="subject"
                control={control}
                rules={{ required: 'Subject is required' }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    margin="dense"
                    label="Email Subject"
                    fullWidth
                    variant="outlined"
                    error={!!error}
                    helperText={error?.message}
                    sx={{ mb: 2 }}
                  />
                )}
              />
              
              <Controller
                name="text"
                control={control}
                rules={{ required: 'Text content is required' }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    margin="dense"
                    label="Text Content"
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                    error={!!error}
                    helperText={error?.message}
                    sx={{ mb: 2 }}
                  />
                )}
              />
              
              <Controller
                name="html"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="dense"
                    label="HTML Content (Optional)"
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                    helperText="HTML version of the email (optional)"
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {createTemplate.isPending || updateTemplate.isPending ? (
                <CircularProgress size={24} />
              ) : editingTemplate ? (
                'Update Template'
              ) : (
                'Create Template'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this template? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="inherit"
            disabled={deleteTemplate.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteTemplate.isPending}
          >
            {deleteTemplate.isPending ? (
              <CircularProgress size={24} />
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Alert 
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16, 
          maxWidth: 400,
          display: snackbar.open ? 'flex' : 'none'
        }}
      >
        {snackbar.message}
      </Alert>
    </Box>
  );
};

export default TemplatesPage;
