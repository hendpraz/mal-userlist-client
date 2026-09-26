import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders the AniMatch brand', () => {
  const { getByRole } = render(<MemoryRouter><App /></MemoryRouter>);
  const linkElement = getByRole('link', { name: /animatch/i });
  expect(linkElement).toBeInTheDocument();
});
