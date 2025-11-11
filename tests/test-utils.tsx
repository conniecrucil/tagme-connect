import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Custom render function that includes common providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

