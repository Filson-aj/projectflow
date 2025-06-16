'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { useForm, Controller } from 'react-hook-form';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();

  const { register, handleSubmit, control, formState: { errors }, watch } = useForm();

  // Mock departments - in real app, fetch from API
  const departmentOptions = [
    { label: 'Computer Science', value: 'CS' },
    { label: 'Engineering', value: 'ENG' },
    { label: 'Mathematics', value: 'MATH' },
    { label: 'Physics', value: 'PHY' },
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Account created successfully! Please sign in to continue.');
        router.push('/auth/signin');
      } else {
        setError(result.error || 'An error occurred during registration');
        toast.error(result.error || 'An error occurred during registration');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center justify-center space-x-2 mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ProjectFlow</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join ProjectFlow</h1>
          <p className="text-gray-600">Create your student account to get started</p>
        </div>

        {/* Sign Up Form */}
        <Card className="p-8 shadow-xl border-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Message severity="error\" text={error} className="w-full" />
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <InputText
                  id="firstName"
                  placeholder="Enter your first name"
                  className={`w-full border-gray-200 ${errors.firstName ? 'p-invalid' : ''}`}
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters'
                    }
                  })}
                />
                {errors.firstName && (
                  <small className="text-red-500">{errors.firstName.message}</small>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <InputText
                  id="lastName"
                  placeholder="Enter your last name"
                  className={`w-full ${errors.lastName ? 'p-invalid' : ''}`}
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters'
                    }
                  })}
                />
                {errors.lastName && (
                  <small className="text-red-500">{errors.lastName.message}</small>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <InputText
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className={`w-full ${errors.email ? 'p-invalid' : ''}`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <small className="text-red-500">{errors.email.message}</small>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <InputText
                  id="phone"
                  placeholder="Enter your phone number"
                  className={`w-full ${errors.phone ? 'p-invalid' : ''}`}
                  {...register('phone', {
                    pattern: {
                      value: /^[\+]?[0-9][\d]{0,15}$/,
                      message: 'Invalid phone number'
                    }
                  })}
                />
                {errors.phone && (
                  <small className="text-red-500">{errors.phone.message}</small>
                )}
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-2">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department *
              </label>
              <Controller
                name="department"
                control={control}
                rules={{ required: 'Please select a department' }}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    options={departmentOptions}
                    placeholder="Select your department"
                    className={`w-full ${errors.department ? 'p-invalid' : ''}`}
                  />
                )}
              />
              {errors.department && (
                <small className="text-red-500">{errors.department.message}</small>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="areaOfResearch" className="block text-sm font-medium text-gray-700">
                Area of Research Interest *
              </label>
              <InputTextarea
                id="areaOfResearch"
                placeholder="Describe your research interests and areas of focus"
                rows={3}
                className={`w-full ${errors.areaOfResearch ? 'p-invalid' : ''}`}
                {...register('areaOfResearch', {
                  required: 'Area of research is required',
                  minLength: {
                    value: 20,
                    message: 'Please provide at least 20 characters'
                  }
                })}
              />
              {errors.areaOfResearch && (
                <small className="text-red-500">{errors.areaOfResearch.message}</small>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <Controller
                  name="password"
                  control={control}
                  rules={{
                    required: 'Password is required', minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  }}
                  render={({ field }) => (
                    <Password
                      id="password"
                      placeholder="Enter your password"
                      inputClassName="w-full"
                      toggleMask
                      feedback={false}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className={errors.password ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.password && (
                  <small className="text-red-500">{errors.password.message}</small>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <Controller
                  name="confirmPassword"
                  control={control}
                  rules={{ required: 'Please confirm your passwrod', validate: (value) => value === watch('password') || 'Passwords do not match' }}
                  render={({ field }) => (
                    <Password
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      inputClassName="w-full"
                      toggleMask
                      feedback={false}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className={errors.confirmPassword ? 'p-invalid' : ''}
                    />
                  )}
                />
                {errors.confirmPassword && (
                  <small className="text-red-500">{errors.confirmPassword.message}</small>
                )}
              </div>
            </div>

            <Button
              type="submit"
              label={loading ? 'Creating Account...' : 'Create Account'}
              loading={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 border-blue-600 py-3"
            />
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}