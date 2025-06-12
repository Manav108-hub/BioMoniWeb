"use client";

import React, { useState } from 'react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useRouter } from 'next/navigation';
import { authService } from '../api/service';
import Navbar from '../components/common/Navbar';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const result = await authService.register({ 
        username, 
        email, 
        password,
        is_admin: false
      });

      if (result.access_token) {
        router.push('/login');
      }
    } catch (error) {
      alert('Registration failed');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full border border-green-100">
          <h2 className="text-3xl font-bold !text-black mb-6 text-center">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Username" value={username} onChange={setUsername} />
            <Input label="Email" value={email} onChange={setEmail} />
            <Input label="Password" type="password" value={password} onChange={setPassword} />
            <Input label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
            <Button title="Register" />
          </form>
          <div className="mt-4 text-center">
            <button 
              onClick={() => router.push('/login')}
              className="text-green-700 hover:underline"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
