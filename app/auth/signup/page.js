'use client';

<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react';
=======
import { useState, useEffect } from 'react';
>>>>>>> d324c04e156fd9852cb3b213ea713d860fe54f8e
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();
  const toastRef = useRef(null);

  const { register, handleSubmit, control, formState: { errors }, watch } = useForm();

  useEffect(() => {
<<<<<<< HEAD
=======
    // Fetch departments and sessions
>>>>>>> d324c04e156fd9852cb3b213ea713d860fe54f8e
    const fetchData = async () => {
      try {
        const [deptRes, sessionsRes] = await Promise.all([
          fetch('/api/admin/departments'),
<<<<<<< HEAD
          fetch('/api/admin/sessions')
=======
          fetch('/api/sessions')
>>>>>>> d324c04e156fd9852cb3b213ea713d860fe54f8e
        ]);

        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartments(deptData.map(dept => ({
            label: `${dept.name} (${dept.code})`,
            value: dept.code
          })));
        }

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setSessions(sessionsData.map(session => ({
            label: session.name,
            value: session.id
          })));
        }
<<<<<<< HEAD
      } catch {
        console.error('Error fetching data');
=======
      } catch (error) {
        console.error('Error fetching data:', error);
>>>>>>> d324c04e156fd9852cb3b213ea713d860fe54f8e
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toastRef.current.show({ severity: 'success', summary: 'Success', detail: 'Account created! Please sign in.', life: 3000 });
        router.push('/auth/signin');
      } else {
        const msg = result.error || 'Registration failed';
        setError(msg);
        toastRef.current.show({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
      }
    } catch {
      const msg = 'An error occurred. Please try again.';
      setError(msg);
      toastRef.current.show({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <Toast ref={toastRef} />
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

        {/* Form */}
        <Card className="p-8 shadow-xl border-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
<<<<<<< HEAD
            {error && <Message severity="error" text={error} className="w-full" />}
=======
            {error && (
              <Message severity="error" text={error} className="w-full" />
            )}
>>>>>>> d324c04e156fd9852cb3b213ea713d860fe54f8e

            {/* Personal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name *</label>
                <InputText
                  id="firstName"
                  {...register('firstName', { required: 'First name is required', minLength: { value: 2, message: 'At least 2 chars' } })}
                  className={`w-full ${errors.firstName ? 'p-invalid' : ''}`}
                />
                {errors.firstName && <small className="text-red-500">{errors.firstName.message}</small>}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name *</label>
                <InputText
                  id="lastName"
                  {...register('lastName', { required: 'Last name is required', minLength: { value: 2, message: 'At least 2 chars' } })}
                  className={`w-full ${errors.lastName ? 'p-invalid' : ''}`}
                />
                {errors.lastName && <small className="text-red-500">{errors.lastName.message}</small>}
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
                <InputText
                  id="email"
                  type="email"
                  {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } })}
                  className={`w-full ${errors.email ? 'p-invalid' : ''}`}
                />
                {errors.email && <small className="text-red-500">{errors.email.message}</small>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <InputText
                  id="phone"
                  {...register('phone', { pattern: { value: /^[\+]?[0-9]{1,16}$/, message: 'Invalid phone' } })}
                  className={`w-full ${errors.phone ? 'p-invalid' : ''}`}
                />
                {errors.phone && <small className="text-red-500">{errors.phone.message}</small>}
              </div>
            </div>

<<<<<<< HEAD
            {/* Academic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dept */}
              <div className="space-y-2">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department *</label>
                <Controller
                  name="department"
                  control={control}
                  rules={{ required: 'Select a department' }}
                  render={({ field }) => <Dropdown {...field} options={departments} className={`w-full ${errors.department ? 'p-invalid' : ''}`} />}
                />
                {errors.department && <small className="text-red-500">{errors.department.message}</small>}
              </div>

              {/* Session */}
              <div className="space-y-2">
                <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700">Academic Session *</label>
                <Controller
                  name="sessionId"
                  control={control}
                  rules={{ required: 'Select a session' }}
                  render={({ field }) => <Dropdown {...field} options={sessions} className={`w-full ${errors.sessionId ? 'p-invalid' : ''}`} />}
                />
                {errors.sessionId && <small className="text-red-500">{errors.sessionId.message}</small>}
=======
            {/* Academic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      options={departments}
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
                <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700">
                  Academic Session *
                </label>
                <Controller
                  name="sessionId"
                  control={control}
                  rules={{ required: 'Please select an academic session' }}
                  render={({ field }) => (
                    <Dropdown
                      {...field}
                      options={sessions}
                      placeholder="Select academic session"
                      className={`w-full ${errors.sessionId ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                {errors.sessionId && (
                  <small className="text-red-500">{errors.sessionId.message}</small>
                )}
>>>>>>> d324c04e156fd9852cb3b213ea713d860fe54f8e
              </div>
            </div>

            {/* Research */}
            <div className="space-y-2">
              <label htmlFor="areaOfResearch" className="block text-sm font-medium text-gray-700">Area of Research Interest *</label>
              <InputTextarea
                id="areaOfResearch"
                rows={3}
                {...register('areaOfResearch', { required: 'Required', minLength: { value: 20, message: 'At least 20 chars' } })}
                className={`w-full ${errors.areaOfResearch ? 'p-invalid' : ''}`}
              />
              {errors.areaOfResearch && <small className="text-red-500">{errors.areaOfResearch.message}</small>}
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password *</label>
                <Controller
                  name="password"
                  control={control}
<<<<<<< HEAD
                  rules={{ required: 'Required', minLength: { value: 8, message: 'At least 8 chars' } }}
                  render={({ field }) => <Password id="password" toggleMask feedback={false} inputClassName="w-full" {...field} className={errors.password ? 'p-invalid' : ''} />}
=======
                  rules={{
                    required: 'Password is required', 
                    minLength: {
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
>>>>>>> d324c04e156fd9852cb3b213ea713d860fe54f8e
                />
                {errors.password && <small className="text-red-500">{errors.password.message}</small>}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                <Controller
                  name="confirmPassword"
                  control={control}
<<<<<<< HEAD
                  rules={{
                    required: 'Confirm your password',
                    validate: value => value === watch('password') || 'Passwords do not match'
                  }}
                  render={({ field }) => <Password id="confirmPassword" toggleMask feedback={false} inputClassName="w-full" {...field} className={errors.confirmPassword ? 'p-invalid' : ''} />}
=======
                  rules={{ 
                    required: 'Please confirm your password', 
                    validate: (value) => value === watch('password') || 'Passwords do not match' 
                  }}
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
>>>>>>> d324c04e156fd9852cb3b213ea713d860fe54f8e
                />
                {errors.confirmPassword && <small className="text-red-500">{errors.confirmPassword.message}</small>}
              </div>
            </div>

            <Button type="submit" label={loading ? 'Creating Account...' : 'Create Account'} loading={loading} className="w-full bg-blue-600 hover:bg-blue-700 border-blue-600 py-3" />
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">Already have an account? <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">Sign in here</Link></p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}