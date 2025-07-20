import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Skeleton,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmailProviderForm from './EmailProviderForm';

type EmailProvider = {
  id: string;
  name: string;
  type: 'mailcow' | 'smtpcom' | 'elasticemail' | 'custom';
  isActive: boolean;
  isDefault: boolean;
  fromEmail: string;
  fromName: string;
  lastUsedAt?: string;
  lastError?: string;
};

const EmailProviderList = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<EmailProvider | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);

  // Fetch providers
  const { data: providers = [], isLoading, error } = useQuery<EmailProvider[]>({
    queryKey: ['emailProviders'],
    queryFn: async () => {
      // In a real app, this would be an API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: '1',
              name: 'Primary Mailcow',
              type: 'mailcow',
              isActive: true,
              isDefault: true,
              fromEmail: 'noreply@example.com',
              fromName: 'Example Team',
              lastUsedAt: new Date().toISOString(),
            },
            {
              id: '2',
              name: 'Backup SMTP.com',
              type: 'smtpcom',
              isActive: true,
              isDefault: false,
              fromEmail: 'noreply@example.com',
              fromName: 'Example Team',
              lastUsedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
          ]);
        }, 500);
      });
    },
  });

  // Set default provider mutation
  const setDefaultProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      // In a real app, this would be an API call
      return new Promise<EmailProvider[]>((resolve) => {
        setTimeout(() => {
          resolve(
            providers.map((p) => ({
              ...p,
              isDefault: p.id === providerId,
            }))
          );
        }, 500);
      });
    },
    onMutate: async (providerId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['emailProviders'] });
      
      // Snapshot the previous value
      const previousProviders = queryClient.getQueryData<EmailProvider[]>(['emailProviders']) || [];
      
      // Optimistically update the cache
      queryClient.setQueryData<EmailProvider[]>(['emailProviders'], (old = []) =>
        old.map((p) => ({
          ...p,
          isDefault: p.id === providerId,
        }))
      );
      
      // Return a context object with the snapshotted value
      return { previousProviders };
    },
    onError: (_err, _providerId, context) => {
      // Rollback on error
      if (context?.previousProviders) {
        queryClient.setQueryData(['emailProviders'], context.previousProviders);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['emailProviders'] });
    },
  });

  // Toggle provider status mutation
  const toggleProviderStatusMutation = useMutation({
    mutationFn: async ({ providerId, isActive }: { providerId: string; isActive: boolean }) => {
      // In a real app, this would be an API call
      return new Promise<EmailProvider[]>((resolve) => {
        setTimeout(() => {
          resolve(
            providers.map((p) =>
              p.id === providerId ? { ...p, isActive } : p
            )
          );
        }, 500);
      });
    },
    onMutate: async ({ providerId, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['emailProviders'] });
      
      // Snapshot the previous value
      const previousProviders = queryClient.getQueryData<EmailProvider[]>(['emailProviders']) || [];
      
      // Optimistically update the cache
      queryClient.setQueryData<EmailProvider[]>(['emailProviders'], (old = []) =>
        old.map((p) =>
          p.id === providerId ? { ...p, isActive } : p
        )
      );
      
      // Return a context object with the snapshotted value
      return { previousProviders };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousProviders) {
        queryClient.setQueryData(['emailProviders'], context.previousProviders);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['emailProviders'] });
    },
  });

  // Delete provider mutation
  const deleteProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      // In a real app, this would be an API call
      return new Promise<EmailProvider[]>((resolve) => {
        setTimeout(() => {
          resolve(providers.filter((p) => p.id !== providerId));
        }, 500);
      });
    },
    onMutate: async (providerId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['emailProviders'] });
      
      // Snapshot the previous value
      const previousProviders = queryClient.getQueryData<EmailProvider[]>(['emailProviders']) || [];
      
      // Optimistically update the cache
      queryClient.setQueryData<EmailProvider[]>(['emailProviders'], (old = []) =>
        old.filter((p) => p.id !== providerId)
      );
      
      // Return a context object with the snapshotted value
      return { previousProviders };
    },
    onError: (_err, _providerId, context) => {
      // Rollback on error
      if (context?.previousProviders) {
        queryClient.setQueryData(['emailProviders'], context.previousProviders);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['emailProviders'] });
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
    },
  });

  const handleAddProvider = () => {
    setEditingProvider(null);
    setIsFormOpen(true);
  };

  const handleEditProvider = (provider: EmailProvider) => {
    setEditingProvider(provider);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (providerId: string) => {
    setProviderToDelete(providerId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (providerToDelete) {
      deleteProviderMutation.mutate(providerToDelete);
    }
  };

  const handleSetDefault = (providerId: string) => {
    setDefaultProviderMutation.mutate(providerId);
  };

  const handleToggleStatus = (provider: EmailProvider) => {
    toggleProviderStatusMutation.mutate({
      providerId: provider.id,
      isActive: !provider.isActive,
    });
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'mailcow':
        return <EmailIcon />;
      case 'smtpcom':
        return <EmailIcon />;
      case 'elasticemail':
        return <EmailIcon />;
      default:
        return <EmailIcon />;
    }
  };

  const getProviderTypeLabel = (type: string) => {
    switch (type) {
      case 'mailcow':
        return 'Mailcow';
      case 'smtpcom':
        return 'SMTP.com';
      case 'elasticemail':
        return 'Elastic Email';
      default:
        return 'Custom SMTP';
    }
  };

  const getStatusColor = (provider: EmailProvider) => {
    if (!provider.isActive) return 'default';
    if (provider.lastError) return 'error';
    return 'success';
  };

  const getStatusText = (provider: EmailProvider) => {
    if (!provider.isActive) return 'Disabled';
    if (provider.lastError) return 'Error';
    return 'Active';
  };

  const getLastUsedText = (lastUsedAt?: string) => {
    if (!lastUsedAt) return 'Never used';
    
    const lastUsed = new Date(lastUsedAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Used today';
    if (diffInDays === 1) return 'Used yesterday';
    if (diffInDays < 7) return `Used ${diffInDays} days ago`;
    if (diffInDays < 30) return `Used ${Math.floor(diffInDays / 7)} weeks ago`;
    return `Used on ${lastUsed.toLocaleDateString()}`;
  };

  if (isLoading) {
    return (
      <Box>
        {[1, 2].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={120}
            sx={{ borderRadius: 2, mb: 2 }}
            animation="wave"
          />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load email providers. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h2">
          Email Providers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProvider}
          size="small"
        >
          Add Provider
        </Button>
      </Box>

      {providers.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No email providers configured
            </Typography>
            <Typography color="text.secondary" paragraph>
              Add your first email provider to start sending emails.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProvider}
              size="large"
              sx={{ mt: 2 }}
            >
              Add Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {providers.map((provider) => (
            <Card
              key={provider.id}
              variant="outlined"
              sx={{
                mb: 2,
                borderLeft: `4px solid ${
                  provider.isDefault 
                    ? theme.palette.primary.main 
                    : theme.palette.divider
                }`,
                opacity: provider.isActive ? 1 : 0.7,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: theme.shadows[2],
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.light,
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    {getProviderIcon(provider.type)}
                  </Avatar>
                }
                action={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 1 }}>
                      <Chip
                        icon={
                          provider.isActive ? (
                            provider.lastError ? (
                              <ErrorIcon fontSize="small" />
                            ) : (
                              <CheckCircleIcon fontSize="small" />
                            )
                          ) : (
                            <WarningIcon fontSize="small" />
                          )
                        }
                        label={getStatusText(provider)}
                        color={getStatusColor(provider)}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    
                    <Tooltip title="Edit provider">
                      <IconButton
                        size="small"
                        onClick={() => handleEditProvider(provider)}
                        sx={{ ml: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {!provider.isDefault && (
                      <Tooltip title="Delete provider">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(provider.id)}
                          color="error"
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                }
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" component="span">
                      {provider.name}
                    </Typography>
                    {provider.isDefault && (
                      <Chip
                        label="Default"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
                subheader={
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={getProviderTypeLabel(provider.type)}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={`${provider.fromName} <${provider.fromEmail}>`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', ml: 1 }}
                    >
                      {getLastUsedText(provider.lastUsedAt)}
                    </Typography>
                  </Box>
                }
                sx={{ pb: 1 }}
              />
              
              <CardContent sx={{ pt: 0, pb: '16px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    {provider.lastError && (
                      <Alert 
                        severity="error" 
                        icon={<ErrorIcon fontSize="inherit" />}
                        sx={{ 
                          mb: 1, 
                          py: 0.5, 
                          '& .MuiAlert-message': { py: '6px' } 
                        }}
                      >
                        <Typography variant="caption">
                          {provider.lastError}
                        </Typography>
                      </Alert>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={provider.isActive}
                            onChange={() => handleToggleStatus(provider)}
                            size="small"
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {provider.isActive ? 'Active' : 'Inactive'}
                          </Typography>
                        }
                        sx={{ mr: 2 }}
                      />
                      
                      {!provider.isDefault && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CheckIcon fontSize="small" />}
                          onClick={() => handleSetDefault(provider.id)}
                          disabled={!provider.isActive}
                          sx={{ mr: 1 }}
                        >
                          Set as Default
                        </Button>
                      )}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon fontSize="small" />}
                      onClick={() => handleEditProvider(provider)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    
                    {!provider.isDefault && (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteIcon fontSize="small" />}
                        onClick={() => handleDeleteClick(provider.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      {/* Email Provider Form */}
      <EmailProviderForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProvider(null);
        }}
        provider={editingProvider}
        onSave={(provider) => {
          // In a real app, this would update the provider in the list
          console.log('Save provider:', provider);
          setIsFormOpen(false);
          setEditingProvider(null);
        }}
        isSaving={false}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Email Provider</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete this email provider? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            disabled={deleteProviderMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteProviderMutation.isPending}
            startIcon={
              deleteProviderMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
          >
            {deleteProviderMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailProviderList;
