'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ContractorRegistration() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tradeSpecialty: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

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
              phone: formData.phone,
              trade_specialty: formData.tradeSpecialty,
              role: 'Contractor',
              status: 'Pending',
            }
          ]);

        if (dbError) {
          console.error('Error inserting user:', dbError);
          setMessage('Auth succeeded, but profile creation failed.');
        } else {
          setMessage('Registration successful! You can now log in.');
          setFormData({ firstName: '', lastName: '', email: '', phone: '', tradeSpecialty: '', password: '' });
          setIsLoginMode(true);
        }
      }
      setIsSubmitting(false);
    }
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
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow"
              placeholder="••••••••"
              required
            />
          </div>

          {!isLoginMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow"
                  placeholder="(555) 123-4567"
                  required={!isLoginMode}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tradeSpecialty" className="text-sm font-semibold text-slate-700">Trade / Specialty</label>
                <select
                  id="tradeSpecialty"
                  name="tradeSpecialty"
                  value={formData.tradeSpecialty}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow text-slate-700"
                  required={!isLoginMode}
                >
                  <option value="" disabled>Select your trade</option>
                  <option value="carpenter">Carpenter</option>
                  <option value="electrician">Electrician</option>
                  <option value="plumber">Plumber</option>
                  <option value="flooring">Flooring Specialist</option>
                  <option value="general">General Contractor</option>
                  <option value="other">Other</option>
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