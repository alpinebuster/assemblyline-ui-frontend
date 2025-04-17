import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { IconButton, styled } from '@mui/material';
import useSplitLayout from 'commons/addons/layout/hooks/useSplitLayout';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import FlexHorizontal from '../flexers/FlexHorizontal';
import Flexport from '../flexers/FlexPort';
import FlexVertical from '../flexers/FlexVertical';
import Layouts, { LayoutState } from './layouts/Layouts';

const SplitLayoutContainer = styled('div')(({ theme }) => ({
  overflow: 'hidden',
  flexGrow: 1
}));

const SplitLayoutLeftCt = styled('div')(({ theme }) => ({
  height: '100%',
  display: 'inline-block',
  backgroundColor: theme.palette.background.default
}));

const SplitLayoutRightCt = styled('div')(({ theme }) => ({
  height: '100%',
  display: 'inline-block',
  backgroundColor: theme.palette.background.default
}));

const SplitLayoutDock = styled('div')(({ theme }) => ({}));

const SplitLayoutLeftAnchor = styled('div')(({ theme }) => ({
  width: '10px',
  '&:hover': {
    backgroundColor: theme.palette.background.paper,
    cursor: 'col-resize'
  }
}));

interface SplitLayoutProps {
  id: string;
  leftMinWidth?: number;
  rightMinWidth?: number;
  initLeftWidthPerc?: number;
  persistentMenu?: boolean;
  persistentMenuDock?: 'left' | 'right';
  disableManualResize?: boolean;
  left: React.ReactElement;
  right: React.ReactElement;
  onRenderLeftDock?: () => React.ReactElement;
  onRenderRightDock?: () => React.ReactElement;
}

const SplitLayout = ({
  id,
  left: leftNode,
  right: rightNode,
  persistentMenu = false,
  persistentMenuDock = 'left',
  leftMinWidth = 300,
  rightMinWidth = 300,
  initLeftWidthPerc = 25,
  disableManualResize = false,
  onRenderLeftDock,
  onRenderRightDock
}: SplitLayoutProps) => {
  // Some states
  const [state, setState] = useState<LayoutState>({
    leftOpen: true,
    rightOpen: true,
    leftWidth: null,
    rightWidth: null,
    width: null,
    layout: null
  });

  // Hook to register event handlers.
  const { register } = useSplitLayout(id);

  // Layout computer ref.
  const computerRef = useRef<Layouts>(new Layouts(leftMinWidth, rightMinWidth, initLeftWidthPerc));

  // Ref to track whether there was a mouse down event on resize anchor.
  const mouseDownRef = useRef<boolean>(false);

  // Some DOM refs
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Utility function the get the current width of container.
  const getWidth = (): number => containerRef.current.getBoundingClientRect().width;

  // Layout Handlers

  const onAnchorMouseDown = useCallback(() => {
    mouseDownRef.current = true;
  }, []);

  const onContainerMouseUp = useCallback(() => {
    mouseDownRef.current = false;
  }, []);

  const onContainerMouseMove = useCallback((event: React.MouseEvent) => {
    if (mouseDownRef.current) {
      setState(computerRef.current.onManualResize(event.movementX));
    }
  }, []);

  const onContainerMouseLeave = useCallback(() => {
    mouseDownRef.current = false;
  }, []);

  const onResize = useCallback(() => {
    setState(computerRef.current.onResize(getWidth()));
  }, []);

  const onOpenLeft = useCallback(() => {
    setState(computerRef.current.onOpenLeft());
  }, []);

  const onCloseLeft = useCallback(() => {
    setState(computerRef.current.onCloseLeft());
  }, []);

  const onOpenRight = useCallback(() => {
    setState(computerRef.current.onOpenRight());
  }, []);

  const onCloseRight = useCallback(() => {
    setState(computerRef.current.onCloseRight());
  }, []);

  const onToggleLeft = useCallback(() => {
    setState(computerRef.current.onToggleLeft());
  }, []);

  const onToggleRight = useCallback(() => {
    setState(computerRef.current.onToggleRight());
  }, []);

  const renderLeftDock = useCallback(
    () =>
      !disableManualResize && (
        <FlexVertical>
          <IconButton onClick={onToggleLeft} size="large">
            <MenuOpenIcon style={{ transform: !state.leftOpen ? 'rotate(180deg)' : null }} />
          </IconButton>
          {onRenderLeftDock && onRenderLeftDock()}
        </FlexVertical>
      ),
    [disableManualResize, state.leftOpen, onRenderLeftDock, onToggleLeft]
  );

  const renderRightDock = useCallback(
    () =>
      !disableManualResize &&
      rightNode && (
        <FlexVertical>
          <IconButton onClick={onToggleRight} size="large">
            <MenuOpenIcon style={{ transform: state.rightOpen ? 'rotate(180deg)' : null }} />
          </IconButton>
          {onRenderRightDock && onRenderRightDock()}
        </FlexVertical>
      ),
    [disableManualResize, rightNode, state.rightOpen, onRenderRightDock, onToggleRight]
  );

  // Ensure we recompute state when rightNode is provided.
  // This handles cases where the component will toggle between
  //  having no right node and having one.
  useEffect(() => {
    setState(computerRef.current.init(getWidth(), !!rightNode));
  }, [rightNode]);

  // Listen for splitlayout events.
  useEffect(() => register({ onOpenLeft, onCloseLeft, onOpenRight, onCloseRight, onToggleLeft, onToggleRight }), []);

  //
  return (
    <FlexVertical>
      <Flexport>
        <FlexHorizontal>
          <ReactResizeDetector handleWidth handleHeight={false} targetRef={containerRef} onResize={onResize}>
            {() => (
              <SplitLayoutContainer
                ref={containerRef}
                onMouseUp={onContainerMouseUp}
                onMouseMove={onContainerMouseMove}
                onMouseLeave={onContainerMouseLeave}
              >
                <SplitLayoutLeftCt
                  style={{
                    position: 'absolute',
                    width: state.leftOpen ? state.leftWidth : leftMinWidth,
                    zIndex: state.leftOpen ? 1 : -1
                  }}
                >
                  <FlexHorizontal>
                    {persistentMenu && persistentMenuDock === 'left' && renderLeftDock()}
                    <div style={{ flexGrow: 1, overflow: state.leftOpen ? 'auto' : 'hidden' }}>{leftNode}</div>
                    {!state.rightOpen && renderRightDock()}
                    {!disableManualResize && <SplitLayoutLeftAnchor ref={anchorRef} onMouseDown={onAnchorMouseDown} />}
                  </FlexHorizontal>
                </SplitLayoutLeftCt>
                <SplitLayoutRightCt
                  style={{
                    position: 'absolute',
                    width: state.rightOpen ? state.rightWidth : rightMinWidth,
                    zIndex: state.rightOpen ? 1 : -1,
                    left: state.rightOpen ? state.leftWidth : 0
                  }}
                >
                  <FlexHorizontal>
                    {!state.leftOpen && renderLeftDock()}
                    <div style={{ flexGrow: 1, overflow: state.rightOpen ? 'auto' : 'hidden' }}>{rightNode}</div>
                    {persistentMenu && persistentMenuDock === 'right' && renderRightDock()}
                  </FlexHorizontal>
                </SplitLayoutRightCt>
              </SplitLayoutContainer>
            )}
          </ReactResizeDetector>
        </FlexHorizontal>
      </Flexport>
    </FlexVertical>
  );
};

export default memo(SplitLayout);
