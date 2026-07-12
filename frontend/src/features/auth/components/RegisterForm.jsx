import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useRegister } from '../hooks/useRegister.js';
import Input from '../../../components/ui/Input.jsx';
import Button from '../../../components/ui/Button.jsx';
import Select from '../../../components/ui/Select.jsx';

const registerSchema = zod.object({
  name: zod.string().min(2, { message: 'Name must be at least 2 characters' }).trim(),
  email: zod.string().email({ message: 'Enter a valid email address' }).trim().toLowerCase(),
  password: zod.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: zod.string().nonempty({ message: 'Please select an access role' }),
});

export const RegisterForm = ({ onToggle }) => {
  const { mutate: performRegister, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: '',
    },
  });

  const onSubmit = (data) => {
    performRegister(data, {
      onSuccess: () => {
        // Toggle back to login form on success
        if (onToggle) onToggle();
      },
    });
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'fleet_manager', label: 'Fleet Manager' },
    { value: 'dispatcher', label: 'Dispatcher' },
    { value: 'safety_officer', label: 'Safety Officer' },
    { value: 'financial_analyst', label: 'Financial Analyst' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full max-w-sm">
      <Input
        label="Full Name"
        type="text"
        placeholder="Karan Sharma"
        error={errors.name?.message}
        disabled={isPending}
        {...register('name')}
      />

      <Input
        label="Email"
        type="email"
        placeholder="karan@transitops.in"
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
        label="Access Role"
        placeholder="Select a role"
        options={roleOptions}
        error={errors.role?.message}
        disabled={isPending}
        {...register('role')}
      />

      <Button type="submit" variant="primary" size="md" isLoading={isPending} className="w-full mt-2">
        Register Account
      </Button>
    </form>
  );
};

export default RegisterForm;
