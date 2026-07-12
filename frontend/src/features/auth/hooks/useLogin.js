import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      return await login(email, password);
    },
    onSuccess: (user) => {
      // On success, redirect to dashboard
      navigate('/dashboard');
    },
  });
};

export default useLogin;
