import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export const useRegister = () => {
  const { registerUser } = useAuth();

  return useMutation({
    mutationFn: async ({ name, email, password, role }) => {
      return await registerUser(name, email, password, role);
    },
    onSuccess: () => {
      toast.success('Registration successful! Please log in to continue.');
    },
    onError: (err) => {
      toast.error(err.message || 'Registration failed');
    },
  });
};

export default useRegister;
