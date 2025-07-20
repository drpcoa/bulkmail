import type { SxProps, Theme } from '@mui/material';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export interface GridContainerProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
  [key: string]: unknown; // For any additional props
}

export interface GridItemProps {
  children: ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  sx?: SxProps<Theme>;
  [key: string]: unknown; // For any additional props
}

// Grid container component for consistent layout
export const GridContainer = ({ children, sx = {}, ...props }: GridContainerProps) => (
  <Box 
    display="grid" 
    gridTemplateColumns="repeat(12, 1fr)" 
    gap={2} 
    sx={sx}
    {...props}
  >
    {children}
  </Box>
);

// Grid item component for consistent layout
export const GridItem = ({ 
  xs = 12, 
  sm, 
  md, 
  lg, 
  xl, 
  children, 
  sx = {},
  ...props 
}: GridItemProps) => {
  const getGridSpan = (value: number | undefined) => {
    if (value === undefined) return undefined;
    const width = (value / 12) * 100;
    return `span ${Math.round(width / (100 / 12)) || 1}`;
  };

  return (
    <Box
      gridColumn={`${getGridSpan(xs)}`}
      sx={{
        ...(sm && { '@media (min-width:600px)': { gridColumn: getGridSpan(sm) } }),
        ...(md && { '@media (min-width:900px)': { gridColumn: getGridSpan(md) } }),
        ...(lg && { '@media (min-width:1200px)': { gridColumn: getGridSpan(lg) } }),
        ...(xl && { '@media (min-width:1536px)': { gridColumn: getGridSpan(xl) } }),
        ...sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
