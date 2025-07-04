'use client';

import { useState, useEffect, useCallback } from 'react';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface AgentRatingProps {
  agentId: string;
  currentRating?: number;
  onRatingChange?: (rating: number) => void;
  showReview?: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export default function AgentRating({ 
  agentId, 
  currentRating = 0, 
  onRatingChange,
  showReview = false,
  size = 'md',
  interactive = true 
}: AgentRatingProps) {
  const [rating, setRating] = useState(currentRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userReview, setUserReview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchUserRating = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`/api/agents/${agentId}/rate`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserRating(data.userRating);
        setUserReview(data.userReview || '');
      }
    } catch {
      // Ignore error silently
    }
  }, [agentId]);

  useEffect(() => {
    if (interactive) fetchUserRating();
  }, [interactive, fetchUserRating]);

  const handleStarClick = async (starRating: number) => {
    if (!interactive) return;
    setRating(starRating);
    setUserRating(starRating);
    if (onRatingChange) onRatingChange(starRating);
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to rate agents');
        return;
      }
      const response = await fetch(`/api/agents/${agentId}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: starRating, review: showReview ? userReview : undefined }),
      });
      if (response.ok) {
        const data = await response.json();
        setRating(data.averageRating);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit rating');
        setRating(currentRating);
        setUserRating(userRating);
      }
    } catch {
      alert('Failed to submit rating');
      setRating(currentRating);
      setUserRating(userRating);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!userRating) {
      alert('Please select a rating first');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to submit a review');
        return;
      }
      const response = await fetch(`/api/agents/${agentId}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: userRating, review: userReview }),
      });
      if (response.ok) {
        const data = await response.json();
        setRating(data.averageRating);
        setShowReviewForm(false);
        alert('Review submitted successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit review');
      }
    } catch {
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  };

  const displayRating = hoverRating || rating;
  const rounded = Math.round((interactive ? displayRating : currentRating) * 2) / 2;

  return (
    <div className="flex flex-col space-y-2">
      {/* Stars */}
      <div
        className="flex items-center group"
        title={`Rated ${(interactive ? rating : currentRating).toFixed(1)} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive || isSubmitting}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`transition-transform duration-150 ${
              interactive ? 'cursor-pointer hover:scale-125 active:scale-110' : 'cursor-default'
            } ${isSubmitting ? 'opacity-50' : ''} outline-none bg-none border-none p-0`}
            tabIndex={interactive ? 0 : -1}
            aria-label={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
          >
            {star <= rounded ? (
              <StarSolid
                className={`${sizeClasses[size]} text-yellow-400 drop-shadow-[0_1px_4px_rgba(255,193,7,0.5)]`}
              />
            ) : (
              <StarOutline
                className={`${sizeClasses[size]} text-gray-500`}
              />
            )}
          </button>
        ))}
        <span className="ml-2 text-yellow-300 font-semibold text-base">
          {(interactive ? rating : currentRating).toFixed(1)}/5
        </span>
      </div>

      {/* Review Form */}
      {showReview && interactive && (
        <div className="space-y-2">
          {!showReviewForm ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              {userReview ? 'Edit review' : 'Add a review'}
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                placeholder="Share your experience with this agent..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                rows={3}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {userReview.length}/500 characters
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReviewSubmit}
                    disabled={isSubmitting || !userRating}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 