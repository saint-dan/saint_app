'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ContractorRegistration() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    primaryLocationId: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Fetch active locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (data && !error) {
        setLocations(data);
      } else if (error) {
        console.error('Error fetching locations:', error.message);
      }
    };
    
    fetchLocations();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    let formattedPhone = formData.phone;

    if (!isLoginMode) {
      const cleanPhone = formData.phone.replace(/\s+/g, '');
      const ukMobileRegex = /^(?:07\d{9}|\+447\d{9})$/;
      if (!ukMobileRegex.test(cleanPhone)) {
        setMessage('Please enter a valid UK mobile number (e.g., 07123 456789).');
        setIsSubmitting(false);
        return;
      }

      // Automatically format '07...' to '+447...' and ensure spaces are stripped
      formattedPhone = cleanPhone.startsWith('07') ? '+44' + cleanPhone.slice(1) : cleanPhone;
    }

    const supabase = createClient();

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setMessage('Failed to log in: ' + error.message);
        setIsSubmitting(false);
      } else {
        router.push('/dashboard');
      }
    } else {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        setMessage('Registration failed: ' + authError.message);
        setIsSubmitting(false);
        return;
      }

      // 2. Insert the contractor profile into the public.users table
      if (authData.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              first_name: formData.firstName,
              last_name: formData.lastName,
              email: formData.email,
              phone: formattedPhone,
              primary_location_id: formData.primaryLocationId,
              role: 'Contractor',
              status: 'Pending',
            }
          ]);

        if (dbError) {
          console.error('Error inserting user:', dbError);
          setMessage('Auth succeeded, but profile creation failed.');
        } else {
          setMessage('Registration successful! You can now log in.');
          setFormData({ firstName: '', lastName: '', email: '', phone: '', primaryLocationId: '', password: '' });
          setIsLoginMode(true);
        }
      }
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.email) {
      setMessage('Please enter your email address to reset your password.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setMessage('Failed to send reset link: ' + error.message);
    } else {
      setMessage('Password reset link sent to your email.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 transition-all duration-300">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {isLoginMode ? 'Contractor Login' : 'Contractor Registration'}
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base">
            {isLoginMode ? 'Welcome back. Please log in to your account.' : 'Join our premium network of professional contractors.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLoginMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-semibold text-slate-700">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow"
                  placeholder="John"
                  required={!isLoginMode}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-semibold text-slate-700">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow"
                  placeholder="Doe"
                  required={!isLoginMode}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow"
              placeholder="john.doe@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
              {isLoginMode && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isSubmitting}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {!isLoginMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-semibold text-slate-700">Mobile Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow"
                  placeholder="07123 456789"
                  required={!isLoginMode}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="primaryLocationId" className="text-sm font-semibold text-slate-700">Primary Location</label>
                <select
                  id="primaryLocationId"
                  name="primaryLocationId"
                  value={formData.primaryLocationId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow text-slate-700"
                  required={!isLoginMode}
                >
                  <option value="" disabled>Select your location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="pt-4">
            {message && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-semibold text-center transition-all ${message.includes('Failed') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting 
                ? (isLoginMode ? 'Logging in...' : 'Registering...') 
                : (isLoginMode ? 'Log In' : 'Complete Registration')}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setMessage('');
              }}
              className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-all"
            >
              {isLoginMode ? 'Register here' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}