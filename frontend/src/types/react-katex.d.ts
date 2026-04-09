declare module 'react-katex' {
  import { ComponentType } from 'react';

  export interface KatexProps {
    children?: string;
    math?: string;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
  }

  export const InlineMath: ComponentType<KatexProps>;
  export const BlockMath: ComponentType<KatexProps>;
}
