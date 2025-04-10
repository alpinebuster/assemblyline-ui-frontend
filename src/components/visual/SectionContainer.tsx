import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse, Divider, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';
import React, { useState } from 'react';

/**
 * TODO: change to PageSection
 */

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: 'inherit',
    gap: theme.spacing(1)
  },
  clickable: {
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover>span, &:focus>span': {
      color: theme.palette.text.secondary
    }
  },
  spacer: {
    paddingBottom: theme.spacing(2),
    paddingTop: theme.spacing(2)
  },
  center: {
    display: 'grid',
    placeItems: 'center'
  },
  flex: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  }
}));

type SectionContainerProps = {
  children?: React.ReactNode;
  title?: string;
  nocollapse?: boolean;
  closed?: boolean;
  variant?: 'default' | 'flex';
  slots?: {
    end?: React.ReactNode;
  };
  slotProps?: {
    wrapper?: React.HTMLProps<HTMLDivElement>;
  };
};

const WrappedSectionContainer: React.FC<SectionContainerProps> = ({
  children = null,
  nocollapse = false,
  closed = false,
  title = null,
  variant = 'default',
  slots = { end: null },
  slotProps = { wrapper: null }
}) => {
  const classes = useStyles();

  const [open, setOpen] = useState<boolean>(!closed);
  const [render, setRender] = useState<boolean>(!closed);

  return (
    <div className={clsx(classes.spacer, variant === 'flex' && classes.flex)}>
      <div
        className={clsx(classes.container, !nocollapse && classes.clickable)}
        onClick={() => (nocollapse ? null : setOpen(o => !o))}
      >
        <Typography variant="h6" children={title} />
        <div style={{ flex: 1 }} />
        {slots?.end}
        <div className={clsx(classes.center)}>{nocollapse ? null : open ? <ExpandLess /> : <ExpandMore />}</div>
      </div>
      <Divider />
      <Collapse
        in={open}
        timeout="auto"
        onEnter={() => setRender(true)}
        sx={{
          ...(variant === 'flex' && {
            '&.MuiCollapse-root': { display: 'flex', flexDirection: 'column', flex: 1 },
            '& .MuiCollapse-wrapper': { display: 'flex', flexDirection: 'column', flex: 1 },
            '& .MuiCollapse-wrapperInner': { display: 'flex', flexDirection: 'column', flex: 1 }
          })
        }}
      >
        <div className={clsx(classes.spacer, variant === 'flex' && classes.flex)} {...slotProps?.wrapper}>
          {render && children}
        </div>
      </Collapse>
    </div>
  );
};

const SectionContainer = React.memo(WrappedSectionContainer);
export default SectionContainer;
