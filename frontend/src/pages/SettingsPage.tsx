import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save as SaveIcon } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

interface SettingsFormData {
  appName: string;
  defaultFromEmail: string;
  defaultFromName: string;
  enableEmailTracking: boolean;
  enableOpenTracking: boolean;
  enableClickTracking: boolean;
  maxEmailsPerMinute: number;
  maxEmailsPerDay: number;
  enableBounceHandling: boolean;
  bounceThreshold: number;
  enableUnsubscribeLinks: boolean;
  unsubscribeLinkText: string;
}

const SettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const defaultValues: SettingsFormData = {
    appName: 'BulkMail',
    defaultFromEmail: 'noreply@example.com',
    defaultFromName: 'BulkMail Team',
    enableEmailTracking: true,
    enableOpenTracking: true,
    enableClickTracking: true,
    maxEmailsPerMinute: 100,
    maxEmailsPerDay: 10000,
    enableBounceHandling: true,
    bounceThreshold: 3,
    enableUnsubscribeLinks: true,
    unsubscribeLinkText: 'Unsubscribe',
  };

  // Initialize query client
  const queryClient = useQueryClient();
  
  // Initialize form with default values
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<SettingsFormData>({
    defaultValues,
  });
  
  // Watch form fields - fix the rest parameter issue
  const watchField = (fieldName: keyof SettingsFormData) => watch(fieldName);
  
  // Fetch settings
  const { data: settings, isPending: isLoading } = useQuery<SettingsFormData>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
  });

  // Reset form when settings are loaded
  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);
  
  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false,
    }));
  };
  
  // Mutation for saving settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success',
      });
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save settings',
        severity: 'error',
      });
    },
  });

  const onSubmit: SubmitHandler<SettingsFormData> = (data) => {
    saveSettingsMutation.mutate(data);
  };

  const formSubmitHandler = handleSubmit(onSubmit);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Render form field helper function
  const renderFormField = (
    name: keyof SettingsFormData,
    label: string,
    type: string = 'text',
    required: boolean = false,
    multiline: boolean = false,
    rows: number = 1,
    validation: any = {}
  ) => {
    const fieldError = errors[name];
    
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? `${label} is required` : false,
          ...validation,
        }}
        render={({ field }) => (
          <TextField
            {...field}
            label={label}
            type={type}
            fullWidth
            variant="outlined"
            margin="normal"
            error={!!fieldError}
            helperText={fieldError?.message}
            multiline={multiline}
            rows={rows}
          />
        )}
      />
    );
  };

  const renderSwitchField = (
    name: keyof SettingsFormData,
    label: string,
    disabled: boolean = false
  ) => (
    <Controller
      name={name as any}
      control={control}
      render={({ field: { value, ...field } }) => (
        <FormControlLabel
          control={
            <Switch
              {...field}
              checked={!!value}
              disabled={disabled || saveSettingsMutation.isPending}
              color="primary"
            />
          }
          label={label}
        />
      )}
    />
  );
  
  // Grid item component - simplified to just use Grid directly with spread props
  const GridItem = (props: {
    children: React.ReactNode;
    xs?: number | 'auto' | boolean;
    md?: number | 'auto' | boolean;
    [key: string]: unknown;
  }) => {
    const { children, ...rest } = props;
    return (
      <Grid {...rest}>
        {children}
      </Grid>
    );
  };
  
  // Grid container component - simplified to just use Grid directly with container prop
  const GridContainer = (props: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const { children, ...rest } = props;
    return (
      <Grid container spacing={3} {...rest}>
        {children}
      </Grid>
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="div">
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Paper component="div" sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="General" {...a11yProps(0)} />
          <Tab label="Email Providers" {...a11yProps(1)} />
          <Tab label="Sending" {...a11yProps(2)} />
          <Tab label="Tracking" {...a11yProps(3)} />
          <Tab label="Bounce Handling" {...a11yProps(4)} />
        </Tabs>
        
        <form onSubmit={formSubmitHandler}>
          <TabPanel value={tabValue} index={0}>
            <GridContainer>
              <GridItem xs={12} md={6}>
                {renderFormField('appName', 'Application Name', 'text', true)}
              </GridItem>
              <GridItem xs={12} md={6}>
                {renderFormField('defaultFromEmail', 'Default From Email', 'email', true, false, 1, {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              </GridItem>
              <GridItem xs={12} md={6}>
                {renderFormField('defaultFromName', 'Default From Name')}
              </GridItem>
            </GridContainer>
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Tracking
            </Typography>
            <GridContainer>
              <GridItem xs={12}>
                {renderSwitchField('enableEmailTracking', 'Enable Email Tracking')}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                  Track when emails are opened and links are clicked
                </Typography>
              </GridItem>
              
              {watchField('enableEmailTracking') && (
                <>
                  <GridItem xs={12}>
                    {renderSwitchField('enableOpenTracking', 'Track Email Opens', true)}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 8 }}>
                      Track when recipients open your emails using a small, invisible tracking pixel
                    </Typography>
                  </GridItem>
                  
                  <GridItem xs={12}>
                    {renderSwitchField('enableClickTracking', 'Track Link Clicks', true)}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 8 }}>
                      Track when recipients click on links in your emails by rewriting the links
                    </Typography>
                  </GridItem>
                </>
              )}
              
              <GridItem xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={
                    saveSettingsMutation.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </GridItem>
            </GridContainer>
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>
              Bounce Handling
            </Typography>
            
            <GridContainer>
              <GridItem xs={12}>
                {renderSwitchField('enableBounceHandling', 'Enable Bounce Handling')}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                  Automatically handle bounced emails and disable sending to invalid addresses
                </Typography>
              </GridItem>
              
              {watchField('enableBounceHandling') && (
                <GridItem xs={12} md={6}>
                  {renderFormField('bounceThreshold', 'Bounce Threshold', 'number', true, false, 1, {
                    min: 1,
                    max: 10,
                  })}
                </GridItem>
              )}
              
              <GridItem xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={
                    saveSettingsMutation.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </GridItem>
            </GridContainer>
          </TabPanel>
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

export default SettingsPage;
