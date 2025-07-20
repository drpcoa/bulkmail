import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { GridContainer, GridItem } from '../components/GridComponents';

type FormData = {
  to: string;
  subject: string;
  text: string;
  html: string;
  from: string;
  replyTo: string;
  provider: string;
};

const SendEmailPage = () => {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const { control, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      to: '',
      subject: '',
      text: '',
      html: '',
      from: '',
      replyTo: '',
      provider: '',
    },
  });

  // Fetch available providers
  const { data: providers = [] } = useQuery<string[]>({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data } = await axios.get('/api/email/providers');
      return data.data.providers || [];
    }
  });

  // Send email mutation
  const sendEmailMutation = useMutation<unknown, Error, FormData>({
    mutationFn: async (data: FormData) => {
      const response = await axios.post('/api/email/send', data);
      return response.data;
    },
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Email sent successfully!',
        severity: 'success',
      });
      reset();
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to send email',
        severity: 'error',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    sendEmailMutation.mutate(data);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Send Email
      </Typography>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <GridContainer>
            <GridItem xs={12} md={6}>
              <Controller
                name="to"
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
                name="subject"
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
            
            <GridItem xs={12} md={6}>
              <Controller
                name="from"
                control={control}
                rules={{ 
                  required: 'From email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="From"
                    fullWidth
                    margin="normal"
                    error={!!error}
                    helperText={error ? error.message : 'The sender email address'}
                  />
                )}
              />
            </GridItem>
            
            <GridItem xs={12} md={6}>
              <Controller
                name="replyTo"
                control={control}
                rules={{
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Reply To"
                    fullWidth
                    margin="normal"
                    error={!!error}
                    helperText={error ? error.message : 'Optional reply-to email address'}
                  />
                )}
              />
            </GridItem>
            
            <GridItem xs={12} md={6}>
              <Controller
                name="provider"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth margin="normal" error={!!error}>
                    <InputLabel>Email Provider</InputLabel>
                    <Select
                      {...field}
                      label="Email Provider"
                      defaultValue=""
                    >
                      <MenuItem value="">
                        <em>Auto-select (recommended)</em>
                      </MenuItem>
                      {providers.map((provider) => (
                        <MenuItem key={provider} value={provider}>
                          {provider}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {error ? error.message : 'Select a specific provider or let the system choose'}
                    </FormHelperText>
                  </FormControl>
                )}
              />
            </GridItem>
            
            <GridItem xs={12}>
              <Controller
                name="text"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Plain Text Content"
                    fullWidth
                    multiline
                    rows={4}
                    margin="normal"
                    error={!!error}
                    helperText={error ? error.message : 'Plain text version of the email'}
                  />
                )}
              />
            </GridItem>
            
            <GridItem xs={12}>
              <Controller
                name="html"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="HTML Content"
                    fullWidth
                    multiline
                    rows={6}
                    margin="normal"
                    error={!!error}
                    helperText={
                      error ? error.message : 'HTML version of the email (optional if plain text is provided)'
                    }
                  />
                )}
              />
            </GridItem>
            
            <GridItem xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={sendEmailMutation.isPending}
                startIcon={
                  sendEmailMutation.isPending ? (
                    <CircularProgress size={20} />
                  ) : null
                }
              >
                {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() => reset()}
                sx={{ ml: 2 }}
                disabled={sendEmailMutation.isPending}
              >
                Reset
              </Button>
            </GridItem>
          </GridContainer>
        </form>
      </Paper>
      
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

export default SendEmailPage;
