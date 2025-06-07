'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useForm } from 'react-hook-form';
import { GraduationCap, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePassword() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Password changed successfully! Please sign in again.');
        await signOut({ callbackUrl: '/auth/signin' });
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to change password');
        toast.error(error.message || 'Failed to change password');
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
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ProjectFlow</span>
          </div>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
          </div>
          
          <p className="text-gray-600">
            Welcome, {session?.user?.firstName}! Please change your password to continue.
          </p>
        </div>

        {/* Change Password Form */}
        <Card className="p-8 shadow-xl border-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Message severity="error\" text={error} className="w-full" />
            )}

            <div className="space-y-2">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <Password
                id="currentPassword"
                placeholder="Enter your current password"
                toggleMask
                feedback={false}
                className={`w-full ${errors.currentPassword ? 'p-invalid' : ''}`}
                inputClassName="w-full"
                {...register('currentPassword', {
                  required: 'Current password is required',
                })}
              />
              {errors.currentPassword && (
                <small className="text-red-500">{errors.currentPassword.message}</small>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <Password
                id="newPassword"
                placeholder="Enter your new password"
                toggleMask
                className={`w-full ${errors.newPassword ? 'p-invalid' : ''}`}
                inputClassName="w-full"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />
              {errors.newPassword && (
                <small className="text-red-500">{errors.newPassword.message}</small>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <Password
                id="confirmPassword"
                placeholder="Confirm your new password"
                toggleMask
                feedback={false}
                className={`w-full ${errors.confirmPassword ? 'p-invalid' : ''}`}
                inputClassName="w-full"
                {...register('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (value) => value === watch('newPassword') || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && (
                <small className="text-red-500">{errors.confirmPassword.message}</small>
              )}
            </div>

            <Button
              type="submit"
              label={loading ? 'Changing Password...' : 'Change Password'}
              loading={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 border-blue-600 py-3"
            />
          </form>
        </Card>
      </motion.div>
    </div>
  );
}