import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar, AppBar, Typography, Drawer, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Container } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Send as SendIcon,
  List as ListIcon,
  Settings as SettingsIcon,
  Email as EmailIcon
} from '@mui/icons-material';

const drawerWidth = 240;

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Send Email', icon: <SendIcon />, path: '/send' },
    { text: 'Batch Send', icon: <ListIcon />, path: '/batch' },
    { text: 'Templates', icon: <EmailIcon />, path: '/templates' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            BulkMail
          </Typography>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            marginTop: '64px' // Adjust based on your AppBar height
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component="a" href={item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px', // Same as AppBar height
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: (theme) => theme.palette.grey[100],
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {children || <Outlet />}
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
