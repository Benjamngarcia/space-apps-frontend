'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../services/auth';
import { TagsByType } from '../../types/auth';
import { Chip } from '../../components/Chip';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    userPss: '',
    confirmPassword: '',
    name: '',
    surname: '',
    birthdate: '',
    zipCode: '',
  });
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [tagsByType, setTagsByType] = useState<TagsByType>({});
  const [tagsLoading, setTagsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/home');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setTagsLoading(true);
      const response = await authService.getTagsByType();
      if (response.success) {
        setTagsByType(response.data.tagsByType);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setTagsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-50 animate-in fade-in duration-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4 transform transition-all duration-300"></div>
          <p className="text-slate-600 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.userPss !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.userPss.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      await register({
        ...registrationData,
        tagIds: selectedTags
      });
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-50 py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-blue-100 mb-6 transform transition-all duration-300 hover:scale-110 hover:rotate-3">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 transition-all duration-300">Join Aeros</h1>
          <p className="text-slate-600 transition-all duration-300">Create your air quality monitoring account</p>
        </div>

        {/* Register Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-slate-200 p-8 transform transition-all duration-500 hover:shadow-xl animate-in slide-in-from-bottom-5 delay-200">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2 transition-all duration-300">
              Create account
            </h2>
            <p className="text-slate-600 transition-all duration-300">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-purple-600 hover:text-purple-700 transition-all duration-200 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  First Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-slate-400 hover:border-slate-400 text-gray-600"
                  placeholder="John"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="surname" className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name
                </label>
                <input
                  id="surname"
                  name="surname"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-400 text-gray-600"
                  placeholder="Doe"
                  value={formData.surname}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-400 text-gray-600"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-slate-700 mb-2">
                  Birth Date
                </label>
                <input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-600"
                  value={formData.birthdate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700 mb-2">
                  ZIP Code
                </label>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-400 text-gray-600"
                  placeholder="12345"
                  value={formData.zipCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="userPss" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                id="userPss"
                name="userPss"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-400 text-gray-600"
                placeholder="Create a strong password"
                value={formData.userPss}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-slate-400 text-gray-600"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            {/* Tags Selection */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Select Your Interests
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Help us personalize your air quality recommendations by selecting relevant tags
                </p>
              </div>

              {tagsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200 border-t-purple-600 mx-auto mb-2"></div>
                  <p className="text-slate-600 text-sm">Loading interests...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(tagsByType).map(([category, tags]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="font-medium text-slate-800 text-sm uppercase tracking-wide">
                        {category}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Chip
                            key={tag.tagId}
                            tagId={tag.tagId}
                            tagName={tag.tagName}
                            tagType={category}
                            isSelected={selectedTags.includes(tag.tagId)}
                            isClickable={true}
                            onClick={toggleTag}
                            size="md"
                            variant="default"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTags.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <span className="font-medium">{selectedTags.length}</span> interest{selectedTags.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm text-red-700 font-medium">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>

            <div className="text-center pt-4">
              <Link href="/" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">
                ← Back to home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
