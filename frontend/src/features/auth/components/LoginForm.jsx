import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import toast from 'react-hot-toast';
import { useLogin } from '../hooks/useLogin.js';
import Input from '../../../components/ui/Input.jsx';
import Button from '../../../components/ui/Button.jsx';
import Select from '../../../components/ui/Select.jsx';

// Zod Schema matching form validations
const loginSchema = zod.object({
  email: zod.string().email({ message: 'Enter a valid email address' }),
  password: zod.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: zod.string().nonempty({ message: 'Please select your role' }),
  rememberMe: zod.boolean().optional(),
});

export const LoginForm = () => {
  const { mutate: performLogin, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: '',
      rememberMe: false,
    },
  });

  const onSubmit = (data) => {
    performLogin(
      { email: data.email, password: data.password },
      {
        onSuccess: (user) => {
          // Verify that user matches selected role
          if (user.role !== data.role) {
            toast.error(`You do not have access as ${data.role}. Active role: ${user.role}`);
          } else {
            toast.success(`Welcome back, ${user.name}!`);
          }
        },
        onError: (err) => {
          toast.error(err.message || 'Incorrect email or password');
        },
      }
    );
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'fleet_manager', label: 'Fleet Manager' },
    { value: 'dispatcher', label: 'Dispatcher' },
    { value: 'safety_officer', label: 'Safety Officer' },
    { value: 'financial_analyst', label: 'Financial Analyst' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full max-w-sm">
      <Input
        label="Email"
        type="email"
        placeholder="Raven.k@transitops.in"
        error={errors.email?.message}
        disabled={isPending}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        disabled={isPending}
        {...register('password')}
      />

      <Select
        label="Role (RBAC)"
        placeholder="Select a role"
        options={roleOptions}
        error={errors.role?.message}
        disabled={isPending}
        {...register('role')}
      />

      <div className="flex items-center justify-between mt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-400">
          <input
            type="checkbox"
            className="accent-accent-orange h-4 w-4 bg-[#121212] border border-border-thin rounded-sm cursor-pointer"
            disabled={isPending}
            {...register('rememberMe')}
          />
          Remember me
        </label>
        <a
          href="#forgot"
          onClick={(e) => {
            e.preventDefault();
            toast('Please contact system administrator to reset password.', { icon: '🔑' });
          }}
          className="text-xs text-[#5a89bc] hover:underline"
        >
          Forgot password?
        </a>
      </div>

      <Button type="submit" variant="primary" size="md" isLoading={isPending} className="w-full mt-2">
        Sign In
      </Button>
    </form>
  );
};

export default LoginForm;
