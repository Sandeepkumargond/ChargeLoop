'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        

      });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Login failed');
            }
        const result = await response.json();
        
        console.log('Login successful:', result);
        
        // Store the token and user email in localStorage
        if (result.token) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('userEmail', data.email);
          
          // Dispatch auth change event to update navbar
          window.dispatchEvent(new Event('authChange'));
          
          // Wait a bit longer before navigation to allow navbar to update
      
          // If no token, still navigate
          router.push('/');
        }
    } catch (error) {
      console.error('Error during login:', error);
        // Handle error (e.g., show error message)
    }
    }
  return (
    <div className="min-h-screen text-black flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            suppressHydrationWarning
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            suppressHydrationWarning
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200"
          suppressHydrationWarning
        >
          Login
        </button>
      </form>
    </div>
  );
}
