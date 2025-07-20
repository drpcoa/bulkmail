import { Box, Paper, Typography } from '@mui/material';

// Grid container component for consistent layout
const GridContainer = ({ children, ...props }: any) => (
  <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={2} {...props}>
    {children}
  </Box>
);

// Grid item component for consistent layout
const GridItem = ({ xs = 12, sm, md, children, ...props }: any) => {
  const getGridSpan = (value: number | undefined) => {
    if (value === undefined) return undefined;
    const width = (value / 12) * 100;
    return `span ${Math.round(width / (100 / 12)) || 1}`;
  };

  return (
    <Box
      gridColumn={`span ${getGridSpan(xs) || 12} / span ${getGridSpan(xs) || 12}`}
      {...(sm && { gridColumn: { sm: `span ${getGridSpan(sm) || 6} / span ${getGridSpan(sm) || 6}` }})}
      {...(md && { gridColumn: { md: `span ${getGridSpan(md) || 4} / span ${getGridSpan(md) || 4}` }})}
      {...props}
    >
      {children}
    </Box>
  );
};
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// Define types for our stats data
interface DashboardStats {
  totalEmails: number;
  delivered: number;
  failed: number;
  inProgress: number;
}

// Mock data - in a real app, this would come from an API
const stats: DashboardStats = {
  totalEmails: 1242,
  delivered: 1024,
  failed: 45,
  inProgress: 173,
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color?: 'primary' | 'success' | 'error' | 'warning';
}

const StatCard = ({ title, value, icon: Icon, color = 'primary' }: StatCardProps) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      height: 140,
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6,
      },
    }}
    elevation={3}
  >
    <Box
      sx={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        backgroundColor: `${color}.light`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 1,
      }}
    >
      <Icon sx={{ fontSize: 30, color: `${color}.dark` }} />
    </Box>
    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {title}
    </Typography>
  </Paper>
);

const DashboardPage = () => {
  // In a real app, you would fetch this data from your API
  const { data: statsData = stats } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      // This would be an API call in a real app
      return new Promise<DashboardStats>((resolve) => {
        setTimeout(() => resolve(stats), 500);
      });
    }
  });

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Dashboard</Typography>
      
      <GridContainer>
        <GridItem xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Emails" 
            value={statsData.totalEmails} 
            icon={EmailIcon} 
            color="primary"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <StatCard 
            title="Delivered" 
            value={statsData.delivered} 
            icon={CheckCircleIcon} 
            color="success"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <StatCard 
            title="Failed" 
            value={statsData.failed} 
            icon={ErrorIcon} 
            color="error"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <StatCard 
            title="In Progress" 
            value={statsData.inProgress} 
            icon={SendIcon} 
            color="warning"
          />
        </GridItem>

        {/* Recent Activity Section */}
        <GridItem xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
            <Typography color="text.secondary">No recent activity to display</Typography>
          </Paper>
        </GridItem>

        {/* Provider Distribution Section */}
        <GridItem xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Provider Distribution</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
              <Typography color="text.secondary">No distribution data available</Typography>
            </Box>
          </Paper>
        </GridItem>
      </GridContainer>
    </Box>
  );
};

export default DashboardPage;
