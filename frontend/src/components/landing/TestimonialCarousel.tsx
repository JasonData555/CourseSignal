import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  revenue: string;
  quote: string;
  outcome: string;
  avatar: string;
  platform: 'Kajabi' | 'Teachable';
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Marketing Course Creator',
    revenue: '$340K/year',
    quote:
      'CourseSignal showed me YouTube drove $12K in sales while Instagram drove $200. I cut Instagram ads and doubled down on YouTube.',
    outcome: 'Saved $2,400/month in ad spend',
    avatar: 'SC',
    platform: 'Kajabi',
  },
  {
    id: 2,
    name: 'Marcus Rodriguez',
    role: 'Fitness Course Business',
    revenue: '$580K/year',
    quote:
      "I thought my email list wasn't converting. Turns out 68% of my revenue comes from email - I just didn't know it. Now I focus there.",
    outcome: 'Increased email revenue by 140%',
    avatar: 'MR',
    platform: 'Teachable',
  },
  {
    id: 3,
    name: 'Jessica Park',
    role: 'Design Course Founder',
    revenue: '$210K/year',
    quote:
      'Found out my best customers come from Pinterest, not Instagram where I was spending all my time. Reallocated my entire strategy.',
    outcome: 'Pinterest now drives 45% of revenue',
    avatar: 'JP',
    platform: 'Kajabi',
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Business Coach',
    revenue: '$890K/year',
    quote:
      'CourseSignal helped me identify that webinar attendees convert at 12% vs organic traffic at 2%. Now I run weekly webinars.',
    outcome: '3x conversion rate improvement',
    avatar: 'DT',
    platform: 'Teachable',
  },
  {
    id: 5,
    name: 'Alicia Martinez',
    role: 'Language Course Creator',
    revenue: '$125K/year',
    quote:
      "TikTok was driving tons of traffic but zero sales. Facebook brought 10x less traffic but converted 8x better. Shifted focus immediately.",
    outcome: 'ROI improved from -$500 to +$3,200/month',
    avatar: 'AM',
    platform: 'Kajabi',
  },
];

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl shadow-elevated p-8 md:p-12 text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-chart-series6 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-600 rounded-full blur-3xl"></div>
      </div>

      {/* Quote icon */}
      <div className="absolute top-8 right-8 opacity-20">
        <Quote className="w-24 h-24" />
      </div>

      {/* Content */}
      <div className="relative">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
              {currentTestimonial.avatar}
            </div>
            <div>
              <div className="font-bold text-xl mb-1">{currentTestimonial.name}</div>
              <div className="text-primary-200 text-sm">{currentTestimonial.role}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-success-400 font-semibold text-sm">
                  {currentTestimonial.revenue}
                </span>
                <span className="text-primary-300 text-sm">•</span>
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                  {currentTestimonial.platform}
                </span>
              </div>
            </div>
          </div>

          <blockquote className="text-xl md:text-2xl leading-relaxed mb-6">
            "{currentTestimonial.quote}"
          </blockquote>

          <div className="inline-block px-4 py-2 bg-success-500/20 border border-success-400/30 rounded-lg">
            <div className="text-success-300 font-semibold text-sm">
              💡 {currentTestimonial.outcome}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all ${
                  index === currentIndex
                    ? 'w-8 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                } rounded-full`}
                aria-label={`Go to testimonial ${index + 1}`}
              ></button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
