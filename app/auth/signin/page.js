'use client';

import { useState, useRef } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useForm, Controller } from 'react-hook-form';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
/* import { toast } from 'sonner'; */
import { Toast } from 'primereact/toast';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useRef(null)

  const { register, handleSubmit, control, formState: { errors } } = useForm({ mode: 'onBlur' });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: 'Invalid email or password',
        });
      } else {
        toast.current.show({
          severity: 'success',
          summary: 'Login',
          detail: 'Welcome back!'
        })

        // Get user session to check role and first login
        const session = await getSession();

        if (session?.user?.isFirstLogin) {
          router.push('/auth/change-password');
        } else {
          // Redirect based on role
          switch (session?.user?.role) {
            case 'ADMIN':
              router.push('/dashboard/admin');
              break;
            case 'COORDINATOR':
              router.push('/dashboard/coordinator');
              break;
            case 'SUPERVISOR':
              router.push('/dashboard/supervisor');
              break;
            case 'STUDENT':
              router.push('/dashboard/student');
              break;
            default:
              router.push('/dashboard');
          }
        }
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
      <Toast ref={toast} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
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

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        {/* Sign In Form */}
        <Card className="p-8 shadow-xl border-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Message severity="error" text={error} className="w-full" />
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Controller
                name="password"
                control={control}
                rules={{ required: 'Password is required' }}
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
                    className={`w-full ${errors.password ? 'p-invalid' : ''}`}
                  />
                )}
              />
              {errors.password && (
                <small className="text-red-500">{errors.password.message}</small>
              )}
            </div>

            <Button
              type="submit"
              label={loading ? 'Signing In...' : 'Sign In'}
              loading={loading}
              className="w-full text-white"
            />
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </Card>

        {/* Demo Credentials */}
        {/* <Card className="mt-6 p-4 bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Demo Credentials</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Admin:</strong> admin@system.com</p>
            <p><strong>Coordinator:</strong> coordinator.cs@system.com</p>
            <p><strong>Supervisor:</strong> supervisor.cs@system.com</p>
            <p><strong>Password:</strong> password (for all roles)</p>
          </div>
        </Card> */}
      </motion.div>
    </div>
  );
}