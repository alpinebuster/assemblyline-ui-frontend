import { useTheme } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useAppBar, useAppLayout, useAppUser } from 'commons/components/app/hooks';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

// TODO: Add to the commons
const useStyles = makeStyles(theme => ({
  tocBar: {
    display: 'none',
    paddingLeft: '16px',
    [theme.breakpoints.up('md')]: {
      display: 'block'
    }
  },
  toc: {
    listStyle: 'none',
    paddingInlineStart: 0,
    [theme.breakpoints.only('md')]: {
      width: '124px'
    },
    [theme.breakpoints.up('lg')]: {
      width: '164px'
    },
    '& li': {
      color: theme.palette.text.primary,
      marginLeft: theme.spacing(1),
      marginBottom: theme.spacing(0.5),
      paddingLeft: theme.spacing(1.25),
      paddingRight: theme.spacing(1)
    },
    '& .active': {
      borderLeft: `solid ${theme.palette.primary.main} 2px`,
      paddingLeft: theme.spacing(1),
      color: theme.palette.primary.main
    },
    '& li:hover': {
      borderLeft: `solid ${theme.palette.text.disabled} 1px`,
      paddingLeft: '9px',
      color: theme.palette.text.disabled
    },
    '& li > a': {
      color: 'inherit',
      display: 'block',
      textDecoration: 'none',
      width: '100%'
    }
  },
  top: {
    paddingTop: theme.spacing(2.5),
    marginLeft: theme.spacing(2.25),
    color: theme.palette.text.primary,
    '& a': {
      color: 'inherit',
      display: 'block',
      textDecoration: 'none'
    },
    '& :hover': {
      color: theme.palette.text.disabled
    }
  }
}));

export type ContentWithTOCItemDef = {
  id: string;
  subItems?: ContentWithTOCItemDef[];
  is_admin?: boolean;
};

export type ContentWithTOCItemProps = {
  translation: string;
  item: ContentWithTOCItemDef;
};

const ContentWithTOCItem: React.FC<ContentWithTOCItemProps> = ({ translation, item }) => {
  const { autoHide: autoHideAppbar } = useAppBar();
  const { current: currentLayout } = useAppLayout();
  const classes = useStyles(autoHideAppbar && currentLayout !== 'top');
  const location = useLocation();
  const { t } = useTranslation([translation]);
  const currentHash = location.hash && location.hash !== '' ? location.hash.substring(1) : null;
  const active = currentHash && currentHash.startsWith(item.id) ? 'active' : null;
  const { user: currentUser } = useAppUser();

  return (
    (!item.is_admin || (currentUser.is_admin && item.is_admin)) && (
      <>
        <li className={active}>
          <Link to={`#${item.id}`} target="_self">
            {t(item.id)}
          </Link>
        </li>
        {active && item.subItems && (
          <ul className={classes.toc} style={{ fontSize: 'smaller', paddingInlineStart: '8px' }}>
            {item.subItems.map(itm => (
              <ContentWithTOCItem key={itm.id} item={itm} translation={translation} />
            ))}
          </ul>
        )}
      </>
    )
  );
};

type ContentWithTOCProps = {
  children: ReactNode;
  translation: string;
  items: ContentWithTOCItemDef[];
  titleI18nKey?: string;
  topI18nKey?: string;
};

const WrappedContentWithTOC: React.FC<ContentWithTOCProps> = ({
  children,
  translation,
  items,
  titleI18nKey = 'toc',
  topI18nKey = 'top'
}) => {
  const { autoHide: autoHideAppbar } = useAppBar();
  const { current: currentLayout } = useAppLayout();
  const theme = useTheme();
  const classes = useStyles();
  const location = useLocation();
  const { t } = useTranslation([translation]);

  useEffect(() => {
    if (location.hash && location.hash !== '') {
      const scrollElement = document.getElementById(location.hash.substring(1));
      if (scrollElement) {
        // If element exists already, use native scrollIntoView.
        scrollElement.scrollIntoView(true);
      } else {
        // eslint-disable-next-line no-console
        console.log('[WARN] Trying to scroll to unknown ID:', location.hash);
      }
    }
  }, [location.hash]);

  return (
    <div id="top" style={{ display: 'flex' }}>
      <div id="content">{children}</div>
      <div id="toc" className={classes.tocBar}>
        <div
          style={{
            position: 'sticky',
            top: theme.spacing(autoHideAppbar && currentLayout !== 'top' ? 5 : 13)
          }}
        >
          {useMemo(
            () => (
              <>
                {titleI18nKey && <div style={{ fontSize: '1.25rem', marginLeft: '18px' }}>{t(titleI18nKey)}</div>}
                <ul className={classes.toc}>
                  {items &&
                    items.map(item => <ContentWithTOCItem key={item.id} item={item} translation={translation} />)}
                  {topI18nKey && (
                    <div className={classes.top}>
                      <Link to="#top" target="_self">
                        {t(topI18nKey)}
                      </Link>
                    </div>
                  )}
                </ul>
              </>
            ),
            [classes.toc, classes.top, items, t, titleI18nKey, topI18nKey, translation]
          )}
        </div>
      </div>
    </div>
  );
};

const ContentWithTOC = React.memo(WrappedContentWithTOC);
export default ContentWithTOC;
