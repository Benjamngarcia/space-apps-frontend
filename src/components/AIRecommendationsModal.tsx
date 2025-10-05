"use client";

import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { useUser } from '../contexts/UserContext';
import { AIRecommendation } from '../types/auth';
import { IconX, IconLoader, IconSparkles, IconAlertCircle, IconCalendar, IconArrowRight } from '@tabler/icons-react';
import AIRecommendationDisplay from './AIRecommendationDisplay';
import CountySelector from './CountySelector';
import Chip from './Chip';
import { coutygeoId } from '../utils/countyCatalog';

interface Props {
  onClose: () => void;
}

export default function AIRecommendationsModal({ onClose }: Props) {
  const { user } = useUser();
  const [step, setStep] = useState<'form' | 'loading' | 'results'>('form');
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  
  // Form state
  const [selectedCounty, setSelectedCounty] = useState('45001'); // Default to first county
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Tags state
  const [availableTags, setAvailableTags] = useState<{ tagId: number; tagName: string; tagType: string }[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  const handleGetRecommendations = async () => {
    if (!selectedCounty) {
      setError('County is required to get recommendations');
      return;
    }

    if (!selectedDate) {
      setError('Date is required to get recommendations');
      return;
    }

    setStep('loading');
    setError(null);

    try {
      // Use selected tags from the form, or user's saved tags as fallback
      const tagIds = selectedTagIds.length > 0 
        ? selectedTagIds 
        : user?.tags?.map(tag => tag.tagId) || [1, 2, 3]; // Default tag IDs if no selection
      
      const response = await authService.getAIRecommendations({
        tagIds,
        outDate: selectedDate,
        countryId: selectedCounty,
      });

      if (response.success && response.data?.recommendation) {
        setRecommendation(response.data.recommendation);
        setShowRecommendation(true);
        setStep('results');
      } else {
        setError('Failed to get AI recommendations');
        setStep('form');
      }
    } catch (err) {
      console.error('Error getting AI recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI recommendations');
      setStep('form');
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleGetRecommendations();
  };

  // Load available tags and initialize with user's saved tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        setTagsLoading(true);
        const response = await authService.getAllTags();
        if (response.success) {
          setAvailableTags(response.data.tags);
          
          // Initialize with user's saved tags if available
          if (user?.tags && user.tags.length > 0) {
            setSelectedTagIds(user.tags.map(tag => tag.tagId));
          }
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
      } finally {
        setTagsLoading(false);
      }
    };

    loadTags();
  }, [user]);

  // Tag selection functions
  const toggleTag = (tagId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const isTagSelected = (tagId: number) => selectedTagIds.includes(tagId);

  // Group tags by category for display
  const tagsByCategory = availableTags.reduce((acc, tag) => {
    if (!acc[tag.tagType]) {
      acc[tag.tagType] = [];
    }
    acc[tag.tagType].push(tag);
    return acc;
  }, {} as Record<string, typeof availableTags>);

  // Auto-trigger on modal open - removed
  // User will fill the form first

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-violet-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
              <IconSparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">AI Environmental Recommendations</h2>
              <p className="text-sm text-slate-600">
                {step === 'form' && 'Select county and date for analysis'}
                {step === 'loading' && 'Analyzing environmental data...'}
                {step === 'results' && `Analysis for ${coutygeoId[selectedCounty as keyof typeof coutygeoId] || selectedCounty}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Form Step */}
          {step === 'form' && (
            <div className="p-6">
              <form onSubmit={handleSubmitForm} className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 mx-auto">
                    <IconSparkles className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-2">Get Personalized AI Recommendations</h3>
                  <p className="text-slate-600">
                    Select a county and analysis date to receive tailored environmental insights for that specific location.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                      <IconAlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* County Selector */}
                  <CountySelector
                    value={selectedCounty}
                    onChange={setSelectedCounty}
                    placeholder="Search for a county..."
                    required
                  />

                  {/* Date Input */}
                  <div>
                    <label htmlFor="date" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <IconCalendar className="w-4 h-4" />
                      Analysis Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-700"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Select the date for environmental analysis (today or future dates)
                    </p>
                  </div>

                  {/* User Tags Display */}
                  {user?.tags && user.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Your Saved Preferences
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {user.tags.map((tag) => (
                          <Chip
                            key={tag.tagId}
                            tagId={tag.tagId}
                            tagName={tag.tagName}
                            tagType={tag.tagType}
                            size="sm"
                            variant="filled"
                            isClickable={false}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        These are automatically included in your analysis
                      </p>
                    </div>
                  )}

                  {/* Tag Selector for this request */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Additional Preferences for This Analysis
                      <span className="text-xs text-slate-500 font-normal block mt-1">
                        Select additional tags to customize this specific recommendation
                      </span>
                    </label>
                    
                    {tagsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-200 border-t-purple-600 mx-auto mb-2"></div>
                        <p className="text-slate-600 text-sm">Loading preferences...</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-4 bg-slate-50">
                        {Object.entries(tagsByCategory).map(([category, tags]) => (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-slate-700 text-sm">
                                {category}
                              </h4>
                              <span className="text-xs text-slate-500">
                                {tags.filter(tag => isTagSelected(tag.tagId)).length} / {tags.length} selected
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                <Chip
                                  key={tag.tagId}
                                  tagId={tag.tagId}
                                  tagName={tag.tagName}
                                  tagType={tag.tagType}
                                  isSelected={isTagSelected(tag.tagId)}
                                  isClickable={true}
                                  onClick={toggleTag}
                                  size="sm"
                                  variant="default"
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                        
                        {selectedTagIds.length > 0 && (
                          <div className="pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-600">
                              <span className="font-medium">{selectedTagIds.length}</span> preferences selected for this analysis
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 transform active:scale-95"
                  >
                    <IconArrowRight className="w-5 h-5" />
                    Get AI Recommendations
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loading Step */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                <IconLoader className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Analyzing Environmental Data</h3>
              <p className="text-slate-600 text-center max-w-md">
                Our AI is processing current air quality conditions for {coutygeoId[selectedCounty as keyof typeof coutygeoId] || selectedCounty} on {selectedDate} with {selectedTagIds.length} selected preferences to generate personalized recommendations...
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Processing location data</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span>Analyzing air quality metrics</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span>Generating personalized insights</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === 'form' && error && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                <IconAlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-red-600 text-center max-w-md">{error}</p>
            </div>
          )}

          {/* Results Step */}
          {step === 'results' && recommendation && showRecommendation && (
            <div className="p-6">
              <div className="mb-6 text-center">
                <button
                  onClick={() => {
                    setStep('form');
                    setRecommendation(null);
                    setShowRecommendation(false);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700 transition-colors"
                >
                  ← Back to Form
                </button>
              </div>
              <AIRecommendationDisplay 
                recommendation={recommendation} 
                isVisible={showRecommendation} 
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'results' && recommendation && (
          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Analysis completed for {coutygeoId[selectedCounty as keyof typeof coutygeoId] || selectedCounty} on {selectedDate} at {new Date().toLocaleTimeString()}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('form');
                    setRecommendation(null);
                    setShowRecommendation(false);
                    setError(null);
                  }}
                  className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition-colors"
                >
                  New Analysis
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
