import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '@/lib/api';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/lib/api', () => ({
  authApi: {
    me: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  },
}));

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <div>Loading Auth...</div>;
  return (
    <div>
      <div data-testid="user-info">{user ? user.username : 'Guest'}</div>
      <button onClick={() => login('admin', 'password123')}>Log In</button>
      <button onClick={() => logout()}>Log Out</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('initializes as Guest when no token is present', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('Guest');
    });
  });

  it('fetches user info on mount if token exists in localStorage', async () => {
    localStorage.setItem('ems_token', 'valid-token-123');
    (authApi.me as jest.Mock).mockResolvedValue({
      data: {
        user: { id: 'user-1', username: 'admin', role: 'ADMIN' },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('admin');
    });
    expect(authApi.me).toHaveBeenCalled();
  });

  it('updates state and localStorage on login', async () => {
    (authApi.login as jest.Mock).mockResolvedValue({
      data: {
        token: 'new-token-456',
        user: { id: 'user-2', username: 'john_doe', role: 'MANAGER' },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('Guest');
    });

    await act(async () => {
      screen.getByText('Log In').click();
    });

    await waitFor(() => {
      expect(localStorage.getItem('ems_token')).toBe('new-token-456');
      expect(screen.getByTestId('user-info')).toHaveTextContent('john_doe');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('clears state and localStorage on logout', async () => {
    localStorage.setItem('ems_token', 'existing-token');
    (authApi.me as jest.Mock).mockResolvedValue({
      data: {
        user: { id: 'user-1', username: 'admin', role: 'ADMIN' },
      },
    });
    (authApi.logout as jest.Mock).mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('admin');
    });

    await act(async () => {
      screen.getByText('Log Out').click();
    });

    await waitFor(() => {
      expect(localStorage.getItem('ems_token')).toBeNull();
      expect(screen.getByTestId('user-info')).toHaveTextContent('Guest');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
