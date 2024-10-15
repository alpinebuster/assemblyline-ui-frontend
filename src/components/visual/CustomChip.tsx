import { Chip, ChipProps, Tooltip, TooltipProps } from '@mui/material';
import { darken } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';
import React from 'react';

declare module '@mui/material/Chip' {
  interface ChipPropsSizeOverrides {
    tiny: true;
  }
}

export const ColorMap = {
  'label-default': 'default' as 'default',
  'label-primary': 'primary' as 'primary',
  'label-secondary': 'secondary' as 'secondary',
  'label-info': 'info' as 'info',
  'label-success': 'success' as 'success',
  'label-warning': 'warning' as 'warning',
  'label-error': 'error' as 'error',
  default: 'default' as 'default',
  primary: 'primary' as 'primary',
  secondary: 'secondary' as 'secondary',
  info: 'info' as 'info',
  success: 'success' as 'success',
  warning: 'warning' as 'warning',
  error: 'error' as 'error'
};
export type PossibleColors = 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

export type CustomChipProps = ChipProps & {
  component?: React.ElementType;
  fullWidth?: boolean;
  mono?: boolean;
  tooltip?: TooltipProps['title'];
  tooltipPlacement?: TooltipProps['placement'];
  type?: 'round' | 'square' | 'rounded';
  wrap?: boolean;
};

export const useStyles = makeStyles(theme => ({
  wrap: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    paddingTop: '2px',
    paddingBottom: '2px'
  },
  square: {
    borderRadius: '0px',
    margin: '2px 4px 2px 0'
  },
  rounded: {
    borderRadius: '3px',
    margin: '2px 4px 2px 0'
  },
  fullWidth: {
    width: '100%'
  },
  tiny: {
    height: '20px',
    fontSize: '0.775rem'
  },
  small: {
    height: '32px'
  },
  label_tiny: {
    paddingLeft: '6px',
    paddingRight: '6px'
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: '1.15rem'
  },
  tiny_mono: {
    fontFamily: 'monospace',
    fontSize: '1rem'
  },
  // Filled
  default: {
    backgroundColor: theme.palette.mode === 'dark' ? '#616161' : '#999',
    color: theme.palette.common.white,
    '[role=button]&:hover, [role=button]&:focus': {
      backgroundColor: darken(theme.palette.mode === 'dark' ? '#616161' : '#999', 0.2)
    }
  },
  primary: {
    '[role=button]&:hover, [role=button]&:focus': {
      backgroundColor: theme.palette.primary.dark
    }
  },
  secondary: {
    '[role=button]&:hover, [role=button]&:focus': {
      backgroundColor: theme.palette.secondary.dark
    }
  },
  success: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    '[role=button]&:hover, [role=button]&:focus': {
      backgroundColor: theme.palette.success.dark
    }
  },
  info: {
    backgroundColor: theme.palette.info.main,
    color: theme.palette.info.contrastText,
    '[role=button]&:hover, [role=button]&:focus': {
      backgroundColor: theme.palette.info.dark
    }
  },
  warning: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
    '[role=button]&:hover, [role=button]&:focus': {
      backgroundColor: theme.palette.warning.dark
    }
  },
  error: {
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.error.contrastText,
    '[role=button]&:hover, [role=button]&:focus': {
      backgroundColor: darken(theme.palette.error.dark, 0.25)
    }
  },
  // Outlined
  success_outlined: {
    borderColor: theme.palette.mode !== 'dark' ? theme.palette.success.dark : theme.palette.success.light,
    color: theme.palette.mode !== 'dark' ? theme.palette.success.dark : theme.palette.success.light
  },
  info_outlined: {
    borderColor: theme.palette.mode !== 'dark' ? theme.palette.info.dark : theme.palette.info.light,
    color: theme.palette.mode !== 'dark' ? theme.palette.info.dark : theme.palette.info.light
  },
  warning_outlined: {
    borderColor: theme.palette.mode !== 'dark' ? theme.palette.warning.dark : theme.palette.warning.light,
    color: theme.palette.mode !== 'dark' ? theme.palette.warning.dark : theme.palette.warning.light
  },
  error_outlined: {
    borderColor: theme.palette.mode !== 'dark' ? theme.palette.error.dark : theme.palette.error.light,
    color: theme.palette.mode !== 'dark' ? theme.palette.error.dark : theme.palette.error.light
  },
  icon: { color: theme.palette.common.white },
  auto_height: {
    height: 'auto'
  }
}));

const WrappedCustomChip: React.FC<CustomChipProps> = ({
  className = null,
  type = 'round',
  size = 'medium',
  color = 'default',
  variant = 'filled',
  mono = false,
  wrap = false,
  tooltip = null,
  fullWidth = false,
  tooltipPlacement = 'bottom',
  children,
  ...otherProps
}) => {
  const classes = useStyles();

  // Define classnames maps
  const typeClassMap = {
    square: classes.square,
    rounded: classes.rounded,
    round: null
  };
  const sizeLabelClassMap = {
    tiny: classes.label_tiny,
    small: null,
    medium: null
  };
  const sizeClassMap = {
    tiny: classes.tiny,
    small: null,
    medium: null
  };
  const colorClassMap = {
    success: classes.success,
    warning: classes.warning,
    error: classes.error,
    info: classes.info,
    success_outlined: classes.success_outlined,
    warning_outlined: classes.warning_outlined,
    error_outlined: classes.error_outlined,
    info_outlined: classes.info_outlined,
    default: classes.default,
    primary: classes.primary,
    secondary: classes.secondary
  };
  const colorMap = {
    primary: 'primary',
    secondary: 'secondary'
  };
  const sizeMap = {
    small: 'small',
    medium: 'medium'
  };

  // Compute values applied to the original chip component
  const appliedClassName = clsx(
    mono ? (size === 'tiny' ? classes.tiny_mono : classes.mono) : null,
    wrap ? classes.auto_height : null,
    fullWidth ? classes.fullWidth : null,
    typeClassMap[type],
    sizeClassMap[size],
    variant === 'outlined' ? colorClassMap[`${color}_outlined`] : colorClassMap[color],
    className
  );
  const labelClassName = clsx(sizeLabelClassMap[size], wrap ? classes.wrap : null);

  // Build chip based on computed values
  const chip = (
    <Chip
      classes={{ label: labelClassName, icon: variant !== 'outlined' ? classes.icon : null }}
      className={appliedClassName}
      size={sizeMap[size]}
      color={colorMap[color]}
      variant={variant}
      {...otherProps}
    />
  );

  // Do we have a tooltip?
  return tooltip ? (
    <Tooltip
      PopperProps={{
        disablePortal: true
      }}
      title={tooltip}
      placement={tooltipPlacement}
      disableInteractive
    >
      {chip}
    </Tooltip>
  ) : (
    chip
  );
};

const CustomChip = React.memo(WrappedCustomChip);
export default CustomChip;
