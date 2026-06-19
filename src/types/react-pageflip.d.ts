declare module 'react-pageflip' {
  import React from 'react';

  interface HTMLFlipBookProps {
    width: number;
    height: number;
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    renderOnlyPageLengthChange?: boolean;
    onFlip?: (e: { data: number }) => void;
    onChangeOrientation?: (e: { data: string }) => void;
    onChangeState?: (e: { data: string }) => void;
    onInit?: (e: { data: string; object: unknown }) => void;
    onUpdate?: (e: { data: string; object: unknown }) => void;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    ref?: React.Ref<unknown>;
  }

  const HTMLFlipBook: React.ForwardRefExoticComponent<
    HTMLFlipBookProps & React.RefAttributes<unknown>
  >;
  export default HTMLFlipBook;
}
