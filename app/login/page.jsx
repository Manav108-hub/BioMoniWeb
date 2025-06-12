"use client";

import React, { useState } from 'react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useRouter } from 'next/navigation';
import { authService } from '../api/service';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await authService.login(email, password);
      login(result);
      if (result.user.is_admin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full border border-green-100">
          <h2 className="text-3xl font-bold !text-black mb-6 text-center">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" value={email} onChange={setEmail} />
            <Input label="Password" type="password" value={password} onChange={setPassword} />
            <Button title="Login" />
          </form>
          <div className="mt-4 text-center">
            <button 
              onClick={() => router.push('/signup')}
              className="text-green-700 hover:underline"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
