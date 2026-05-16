import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { useToast } from '../../hooks/useToast';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const { addToast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const isNewUser = searchParams.get('new') === 'true';

      if (!token) {
        addToast({
          type: 'error',
          title: 'Authentication Failed',
          message: 'No authentication token received from Google.',
        });
        navigate('/signin');
        return;
      }

      try {
        // 1. Store the token
        setToken(token);

        // 2. Fetch the full user profile
        // Note: The token is already in axios headers due to setToken + request interceptor
        const user = await authService.getMe();
        setUser(user);

        // 3. Navigate appropriately
        if (isNewUser) {
          navigate('/onboarding');
        } else {
          // Check if there's a returnTo URL in session storage
          const returnTo = sessionStorage.getItem('returnTo') || '/home';
          sessionStorage.removeItem('returnTo');
          navigate(returnTo);
        }

        addToast({
          type: 'success',
          title: 'Welcome!',
          message: `Signed in as ${user.displayName}`,
        });
      } catch (error) {
        console.error('OAuth Callback Error:', error);
        addToast({
          type: 'error',
          title: 'Authentication Error',
          message: 'Failed to complete Google authentication.',
        });
        navigate('/signin');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken, setUser, addToast]);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-secondary">Completing sign in...</h2>
        <p className="text-hint">You will be redirected in a moment.</p>
      </div>
    </div>
  );
}
