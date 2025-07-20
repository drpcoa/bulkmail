import { useState, useEffect } from 'react';

// Simple div-based container component
const GridContainer = (props: any) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '-8px' }} {...props}>
    {props.children}
  </div>
);

// Simple div-based item component
const GridItem = (props: any) => {
  const { xs = 12, sm, md, lg, xl, style, ...rest } = props;
  const flexBasis = xs ? `${(xs / 12) * 100}%` : '100%';
  const flexStyle = {
    flex: `1 1 ${flexBasis}`,
    padding: '8px',
    ...style,
  };
  
  return (
    <div style={flexStyle} {...rest}>
      {props.children}
    </div>
  );
};

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { Visibility, VisibilityOff, HelpOutline } from '@mui/icons-material';

type EmailProvider = {
  id?: string;
  name: string;
  type: 'mailcow' | 'smtpcom' | 'elasticemail' | 'custom';
  isActive: boolean;
  isDefault: boolean;
  apiKey?: string;
  apiUrl?: string;
  fromEmail: string;
  fromName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
};

interface EmailProviderFormProps {
  open: boolean;
  onClose: () => void;
  provider?: EmailProvider | null;
  onSave: (provider: EmailProvider) => void;
  isSaving: boolean;
}

const EmailProviderForm: React.FC<EmailProviderFormProps> = ({
  open,
  onClose,
  provider,
  onSave,
  isSaving,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmailProvider>({
    defaultValues: {
      name: '',
      type: 'mailcow',
      isActive: true,
      isDefault: false,
      fromEmail: '',
      fromName: '',
      apiKey: '',
      apiUrl: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      smtpSecure: true,
    },
  });

  const providerType = watch('type');
  const isEditing = !!provider?.id;

  useEffect(() => {
    if (provider) {
      // Reset form with provider data when editing
      Object.entries(provider).forEach(([key, value]) => {
        setValue(key as keyof EmailProvider, value);
      });
    } else {
      // Reset form with default values when adding new provider
      reset({
        name: '',
        type: 'mailcow',
        isActive: true,
        isDefault: false,
        fromEmail: '',
        fromName: '',
        apiKey: '',
        apiUrl: '',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        smtpSecure: true,
      });
    }
  }, [provider, reset, setValue]);

  const onSubmit = (data: EmailProvider) => {
    onSave(data);
  };

  const getProviderFields = () => {
    switch (providerType) {
      case 'mailcow':
        return (
          <GridContainer>
            <GridItem xs={12}>
              <Controller
                name="apiUrl"
                control={control}
                rules={{
                  required: 'API URL is required',
                  pattern: {
                    value: /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i,
                    message: 'Please enter a valid URL',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="API URL"
                    fullWidth
                    margin="normal"
                    error={!!errors.apiUrl}
                    helperText={errors.apiUrl?.message || 'The base URL of your Mailcow instance (e.g., https://mail.example.com)'}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <Controller
                name="apiKey"
                control={control}
                rules={{
                  required: 'API Key is required',
                  minLength: {
                    value: 32,
                    message: 'API Key must be at least 32 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="API Key"
                    type={showApiKey ? 'text' : 'password'}
                    fullWidth
                    margin="normal"
                    error={!!errors.apiKey}
                    helperText={
                      errors.apiKey?.message ||
                      'Your Mailcow API key with sufficient permissions'
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowApiKey(!showApiKey)}
                            edge="end"
                          >
                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
        );

      case 'smtpcom':
        return (
          <GridContainer>
            <GridItem xs={12}>
              <Controller
                name="apiKey"
                control={control}
                rules={{ required: 'API Key is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SMTP.com API Key"
                    type={showApiKey ? 'text' : 'password'}
                    fullWidth
                    margin="normal"
                    error={!!errors.apiKey}
                    helperText={
                      errors.apiKey?.message ||
                      'Your SMTP.com API key (starts with "api-")'
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowApiKey(!showApiKey)}
                            edge="end"
                          >
                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
        );

      case 'elasticemail':
        return (
          <GridContainer>
            <GridItem xs={12}>
              <Controller
                name="apiKey"
                control={control}
                rules={{ required: 'API Key is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Elastic Email API Key"
                    type={showApiKey ? 'text' : 'password'}
                    fullWidth
                    margin="normal"
                    error={!!errors.apiKey}
                    helperText={
                      errors.apiKey?.message ||
                      'Your Elastic Email API key'
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowApiKey(!showApiKey)}
                            edge="end"
                          >
                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
        );

      case 'custom':
        return (
          <GridContainer>
            <GridItem xs={12}>
              <Controller
                name="smtpHost"
                control={control}
                rules={{ required: 'SMTP Host is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SMTP Host"
                    fullWidth
                    margin="normal"
                    error={!!errors.smtpHost}
                    helperText={errors.smtpHost?.message || 'e.g., smtp.example.com'}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12} sm={6}>
              <Controller
                name="smtpPort"
                control={control}
                rules={{
                  required: 'Port is required',
                  min: { value: 1, message: 'Port must be between 1 and 65535' },
                  max: { value: 65535, message: 'Port must be between 1 and 65535' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SMTP Port"
                    type="number"
                    fullWidth
                    margin="normal"
                    error={!!errors.smtpPort}
                    helperText={errors.smtpPort?.message || 'Typically 25, 465 (SSL), or 587 (TLS)'}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12} sm={6}>
              <Controller
                name="smtpSecure"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Use SSL/TLS"
                      labelPlacement="start"
                      sx={{ 
                        justifyContent: 'space-between',
                        ml: 0,
                        width: '100%',
                      }}
                    />
                  </FormControl>
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <Controller
                name="smtpUser"
                control={control}
                rules={{ required: 'SMTP Username is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SMTP Username"
                    fullWidth
                    margin="normal"
                    error={!!errors.smtpUser}
                    helperText={errors.smtpUser?.message}
                  />
                )}
              />
            </GridItem>
            <GridItem xs={12}>
              <Controller
                name="smtpPassword"
                control={control}
                rules={{
                  required: 'SMTP Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SMTP Password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    margin="normal"
                    error={!!errors.smtpPassword}
                    helperText={errors.smtpPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </GridItem>
          </GridContainer>
        );

      default:
        return null;
    }
  };

  const getProviderDocumentationLink = () => {
    switch (providerType) {
      case 'mailcow':
        return 'https://docs.mailcow.email/';
      case 'smtpcom':
        return 'https://www.smtp.com/smtp-api-documentation/';
      case 'elasticemail':
        return 'https://elasticemail.com/resources/api-documentation/';
      default:
        return '#';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="provider-form-dialog-title"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle id="provider-form-dialog-title">
          {isEditing ? 'Edit Email Provider' : 'Add New Email Provider'}
        </DialogTitle>
        
        <DialogContent>
          <GridContainer sx={{ mt: 1 }}>
            <GridItem xs={12}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Provider name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Provider Name"
                    fullWidth
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name?.message || 'A descriptive name for this provider'}
                  />
                )}
              />
            </GridItem>
            
            <GridItem xs={12}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal" error={!!errors.type}>
                    <InputLabel id="provider-type-label">Provider Type</InputLabel>
                    <Select
                      {...field}
                      labelId="provider-type-label"
                      label="Provider Type"
                      disabled={isEditing}
                    >
                      <MenuItem value="mailcow">Mailcow</MenuItem>
                      <MenuItem value="smtpcom">SMTP.com</MenuItem>
                      <MenuItem value="elasticemail">Elastic Email</MenuItem>
                      <MenuItem value="custom">Custom SMTP</MenuItem>
                    </Select>
                    {errors.type && (
                      <FormHelperText>{errors.type.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
              
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Need help setting up {providerType}?
                </Typography>
                <Button
                  size="small"
                  href={getProviderDocumentationLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ ml: 1 }}
                >
                  View Documentation
                  </Button>
                </Box>
            </GridItem>
            
            <GridItem xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Sender Information
              </Typography>
            </GridItem>
            
            <GridItem xs={12} sm={6}>
              <Controller
                name="fromName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Sender Name"
                    variant="outlined"
                    margin="normal"
                    error={!!errors.fromName}
                    helperText={errors.fromName?.message}
                  />
                )}
              />
            </GridItem>
            
            <GridItem xs={12} sm={6}>
              <Controller
                name="fromEmail"
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Sender Email"
                    variant="outlined"
                    margin="normal"
                    error={!!errors.fromEmail}
                    helperText={errors.fromEmail?.message}
                  />
                )}
              />
            </GridItem>
            
            <GridItem xs={12}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        color="primary"
                      />
                    }
                    label="Active Provider"
                  />
                )}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                {watch('isActive')
                  ? 'This provider is currently active and can be used for sending emails.'
                  : 'This provider is currently inactive and will not be used for sending emails.'}
              </Typography>
            </GridItem>
            
            <GridItem xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 0, mr: 1 }}>
                  {providerType === 'custom' ? 'SMTP Configuration' : 'API Configuration'}
                </Typography>
                <Tooltip 
                  title={
                    providerType === 'custom' 
                      ? 'Enter your SMTP server details' 
                      : `Enter your ${providerType} API credentials`
                  }
                  arrow
                >
                  <HelpOutline fontSize="small" sx={{ color: 'action.active' }} />
                </Tooltip>
              </Box>
            </GridItem>
            
            {getProviderFields()}
            
            {providerType !== 'custom' && (
              <GridItem xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Make sure to whitelist our IP addresses in your {providerType} account
                    to ensure reliable email delivery.
                  </Typography>
                </Alert>
              </GridItem>
            )}
          </GridContainer>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={onClose} 
            disabled={isSaving}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSaving}
            startIcon={
              isSaving ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {isSaving ? 'Saving...' : 'Save Provider'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmailProviderForm;
