"use client";

import { useState, useEffect } from 'react';
import { IconSparkles, IconExclamationCircle, IconBulb, IconHome, IconCheck } from '@tabler/icons-react';

interface AIRecommendation {
  country: string;
  date: string;
  dominant_pollutant: string;
  risk_level_label: string;
  scores: {
    outdoor_suitability: number;
    health_risk: number;
    confidence: number;
  };
  pollutants: {
    NO2: number;
    O3: number;
    PM: number;
    CH2O: number;
    AI: number;
  };
  tailored_notes: string[];
  recommendations: string[];
  indoor_alternatives: string[];
  disclaimer: string;
}

interface Props {
  recommendation: AIRecommendation;
  isVisible: boolean;
}

const useTypewriter = (text: string, speed: number = 50, isVisible: boolean = true) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setDisplayText('');
      setIsComplete(false);
      return;
    }

    setDisplayText('');
    setIsComplete(false);
    let i = 0;

    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, isVisible]);

  return { displayText, isComplete };
};

const getRiskLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'good':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'moderate':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'usg':
    case 'unhealthy for sensitive groups':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'unhealthy':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'very unhealthy':
    case 'hazardous':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export default function AIRecommendationDisplay({ recommendation, isVisible }: Props) {
  const [currentSection, setCurrentSection] = useState(0);
  const [allSectionsComplete, setAllSectionsComplete] = useState(false);
  const [introText, setIntroText] = useState('');
  const [analysisText, setAnalysisText] = useState('');

  // Create text for each section
  const fullIntroText = `Based on the current air quality data for ${recommendation.country}, I've analyzed the environmental conditions and prepared personalized recommendations for you.`;
  
  const fullAnalysisText = `The air quality status is currently "${recommendation.risk_level_label}" with ${recommendation.dominant_pollutant} being the dominant pollutant. Your outdoor suitability score is ${recommendation.scores.outdoor_suitability}/100, with a health risk level of ${recommendation.scores.health_risk}/100.`;

  const { displayText: introDisplay, isComplete: introComplete } = useTypewriter(
    fullIntroText, 
    30, 
    isVisible && currentSection === 0
  );

  const { displayText: analysisDisplay, isComplete: analysisComplete } = useTypewriter(
    fullAnalysisText, 
    25, 
    isVisible && currentSection === 1
  );

  // Update stored text when typing completes
  useEffect(() => {
    if (introComplete) {
      setIntroText(fullIntroText);
    }
  }, [introComplete, fullIntroText]);

  useEffect(() => {
    if (analysisComplete) {
      setAnalysisText(fullAnalysisText);
    }
  }, [analysisComplete, fullAnalysisText]);

  useEffect(() => {
    if (introComplete && currentSection === 0) {
      setTimeout(() => setCurrentSection(1), 1000);
    }
    if (analysisComplete && currentSection === 1) {
      setTimeout(() => {
        setCurrentSection(2);
        setAllSectionsComplete(true);
      }, 1000);
    }
  }, [introComplete, analysisComplete, currentSection]);

  if (!isVisible) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Introduction */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 animate-pulse"></div>
          <div>
            <p className="text-slate-700 leading-relaxed">
              {currentSection === 0 ? introDisplay : introText}
              {currentSection === 0 && !introComplete && (
                <span className="inline-block w-2 h-5 bg-purple-600 ml-1 animate-pulse"></span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis */}
      {currentSection >= 1 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 animate-pulse"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(recommendation.risk_level_label)}`}>
                  {recommendation.risk_level_label}
                </span>
                <span className="text-xs text-slate-500">
                  Dominant pollutant: {recommendation.dominant_pollutant}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {currentSection === 1 ? analysisDisplay : analysisText}
                {currentSection === 1 && !analysisComplete && (
                  <span className="inline-block w-2 h-5 bg-purple-600 ml-1 animate-pulse"></span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Sections */}
      {allSectionsComplete && (
        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-700">
          {/* Tailored Notes */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <IconBulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Key Insights</h3>
            </div>
            <ul className="space-y-2">
              {recommendation.tailored_notes.map((note, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-2 text-blue-800 animate-in slide-in-from-left-5 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <IconCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <IconExclamationCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Recommended Actions</h3>
            </div>
            <ul className="space-y-2">
              {recommendation.recommendations.map((rec, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-2 text-green-800 animate-in slide-in-from-left-5 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <IconCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Indoor Alternatives */}
          {recommendation.indoor_alternatives.length > 0 && (
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconHome className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">Indoor Alternatives</h3>
              </div>
              <ul className="space-y-2">
                {recommendation.indoor_alternatives.map((alt, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-2 text-amber-800 animate-in slide-in-from-left-5 duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <IconCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scores */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Analysis Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{recommendation.scores.outdoor_suitability}</div>
                <div className="text-sm text-slate-600">Outdoor Suitability</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{recommendation.scores.health_risk}</div>
                <div className="text-sm text-slate-600">Health Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{recommendation.scores.confidence}</div>
                <div className="text-sm text-slate-600">Confidence</div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-600 text-center">
              {recommendation.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
