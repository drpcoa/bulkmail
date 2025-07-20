import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TextField,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { GridContainer, GridItem } from '../components/GridComponents';



type BatchEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type FormData = {
  emails: BatchEmail[];
  concurrency: number;
  provider: string;
};

const BatchSendPage = () => {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const [batchResult, setBatchResult] = useState<any>(null);

  const { control, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      emails: [
        {
          to: '',
          subject: '',
          text: '',
          html: '',
        },
      ],
      concurrency: 5,
      provider: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails',
  });

  const queryClient = useQueryClient();

  // Fetch available providers
  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data } = await axios.get('/api/email/providers');
      return data.data.providers;
    },
  });

  // Start sending batch mutation
  const startSendingMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const response = await axios.post('/api/email/start-sending-batch', { batchId });
      return response.data;
    },
    onSuccess: (_, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['batchStatus', batchId] });
      setSnackbar({
        open: true,
        message: 'Batch sending started successfully',
        severity: 'success',
      });
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Error starting batch send',
        severity: 'error',
      });
    },
  });

  // Send batch emails mutation
  const sendBatchMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post('/api/email/send-batch', data);
      return response.data;
    },
    onSuccess: (data) => {
      setBatchResult(data);
      if (data.data?.batchId) {
        startSendingMutation.mutate(data.data.batchId);
      }
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to send batch emails',
        severity: 'error',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Filter out any empty email entries
    const validEmails = data.emails.filter(
      (email) => email.to && email.subject && email.text
    );
    
    if (validEmails.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please add at least one valid email',
        severity: 'warning',
      });
      return;
    }
    
    sendBatchMutation.mutate({
      ...data,
      emails: validEmails,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const addEmailTemplate = () => {
    append({
      to: '',
      subject: '',
      text: '',
      html: '',
    });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Batch Send Emails
      </Typography>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <GridContainer>
            <GridItem xs={12} md={6}>
              <Controller
                name="concurrency"
                control={control}
                rules={{ min: 1, max: 20 }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Concurrency"
                    type="number"
                    fullWidth
                    margin="normal"
                    inputProps={{ min: 1, max: 20 }}
                    error={!!error}
                    helperText={error ? 'Must be between 1 and 20' : 'Number of concurrent emails to send'}
                  />
                )}
              />
            </GridItem>
            
            <GridItem xs={12} md={6}>
              <Controller
                name="provider"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Email Provider</InputLabel>
                    <Select
                      {...field}
                      label="Email Provider"
                      defaultValue=""
                    >
                      <MenuItem value="">
                        <em>Default (Auto-select)</em>
                      </MenuItem>
                      {providers?.map((provider: string) => (
                        <MenuItem key={provider} value={provider}>
                          {provider}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Select a specific provider or use the default
                    </FormHelperText>
                  </FormControl>
                )}
              />
            </GridItem>
            
            <GridItem xs={12}>
              <Typography variant="h6" gutterBottom>
                Email Templates
              </Typography>
              
              {fields.map((field, index) => (
                <Paper
                  key={field.id}
                  variant="outlined"
                  sx={{ p: 2, mb: 2, position: 'relative' }}
                >
                  <IconButton
                    onClick={() => remove(index)}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      color: 'error.main',
                    }}
                    aria-label="delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                  
                  <GridContainer>
                    <GridItem xs={12} md={6}>
                      <Controller
                        name={`emails.${index}.to`}
                        control={control}
                        rules={{
                          required: 'Recipient email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            label="To"
                            fullWidth
                            margin="normal"
                            error={!!error}
                            helperText={error ? error.message : ''}
                          />
                        )}
                      />
                    </GridItem>
                    
                    <GridItem xs={12} md={6}>
                      <Controller
                        name={`emails.${index}.subject`}
                        control={control}
                        rules={{ required: 'Subject is required' }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            label="Subject"
                            fullWidth
                            margin="normal"
                            error={!!error}
                            helperText={error ? error.message : ''}
                          />
                        )}
                      />
                    </GridItem>
                    
                    <GridItem xs={12}>
                      <Controller
                        name={`emails.${index}.text`}
                        control={control}
                        rules={{ required: 'Message is required' }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            label="Message"
                            fullWidth
                            multiline
                            rows={3}
                            margin="normal"
                            error={!!error}
                            helperText={error ? error.message : 'Plain text version of your email'}
                          />
                        )}
                      />
                    </GridItem>
                    
                    <GridItem xs={12}>
                      <Controller
                        name={`emails.${index}.html`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="HTML Content (Optional)"
                            fullWidth
                            multiline
                            rows={3}
                            margin="normal"
                            helperText="HTML version of your email (optional)"
                          />
                        )}
                      />
                    </GridItem>
                  </GridContainer>
                </Paper>
              ))}
              
              <Button
                onClick={addEmailTemplate}
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 1 }}
              >
                Add Email Template
              </Button>
            </GridItem>
            
            <GridItem xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={sendBatchMutation.isPending}
                startIcon={
                  sendBatchMutation.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {sendBatchMutation.isPending ? 'Sending...' : 'Send Batch Emails'}
              </Button>
              
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() => reset()}
                sx={{ ml: 2 }}
                disabled={sendBatchMutation.isPending}
              >
                Reset
              </Button>
            </GridItem>
          </GridContainer>
        </form>
      </Paper>
      
      {batchResult && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Batch Send Results
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography>
              <strong>Total:</strong> {batchResult.data.total} emails
            </Typography>
            <Typography color="success.main">
              <strong>Successful:</strong> {batchResult.data.success} emails
            </Typography>
            <Typography color="error.main">
              <strong>Failed:</strong> {batchResult.data.failed} emails
            </Typography>
          </Box>
          
          {batchResult.data.failed > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Failed Emails:
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>To</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batchResult.data.results
                      .filter((result: any) => !result.success)
                      .map((result: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{result.to || 'N/A'}</TableCell>
                          <TableCell>{result.subject || 'N/A'}</TableCell>
                          <TableCell>{result.error || 'Unknown error'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BatchSendPage;
