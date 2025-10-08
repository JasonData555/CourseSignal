import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/design-system';
import {
  InteractiveDashboardDemo,
  LiveMatchRateWidget,
  ROICalculator,
  ComparisonSlider,
  LaunchLeaderboard,
  SocialProofMetrics,
  TestimonialCarousel,
} from '../components/landing';
import {
  ArrowRight,
  Play,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  Rocket,
  Shield,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  ChevronDown,
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleExploreDemoData = () => {
    navigate('/demo');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-900">CourseSignal</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                How It Works
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                Pricing
              </a>
              <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                FAQ
              </a>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button size="sm" onClick={handleGetStarted}>
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
        {/* Early Adopter Banner */}
        <div className="bg-gradient-to-r from-warning-500 to-warning-600 text-white py-2 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Zap className="w-4 h-4" />
            <span>Lock in early pricing: Starter $49/mo • Pro $99/mo • Premium $199/mo</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white py-20 lg:py-28">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-chart-series6 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - 55% */}
            <div className="lg:pr-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Track which marketing drives revenue, not just clicks
              </h1>

              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-700 mb-6 leading-tight">
                Revenue analytics built for Kajabi, Teachable, and Stripe
              </p>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                Connect Kajabi, Teachable, or Stripe. Track your evergreen sales AND launch promotions.
                See which YouTube videos, emails, and ads actually generate revenue—not just clicks.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-4">
                  See Your Attribution Data
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="secondary" onClick={handleExploreDemoData} className="text-lg px-8 py-4">
                  <Play className="mr-2 w-5 h-5" />
                  Explore with Sample Data
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                No credit card required • 2-minute setup • 14-day free trial
              </p>

              {/* Rotating Testimonial */}
              <div className="mt-12 p-6 bg-white rounded-lg shadow-card border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                    SC
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium mb-2">
                      "CourseSignal showed me YouTube drove $12K in sales while Instagram drove $200.
                      I cut Instagram ads and doubled down on YouTube."
                    </p>
                    <p className="text-sm text-gray-600">
                      — Sarah Chen, $340K/year course creator
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - 45% - Interactive Dashboard Demo */}
            <div className="relative">
              <InteractiveDashboardDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Problem */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-8 h-8 text-danger-500" />
                <h2 className="text-3xl font-bold text-gray-900">You're marketing blind</h2>
              </div>

              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-danger-500 font-bold">—</span>
                  <span>Spending $3K/month on ads</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-danger-500 font-bold">—</span>
                  <span>Creating YouTube content weekly</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-danger-500 font-bold">—</span>
                  <span>Sending daily emails</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-danger-500 font-bold">—</span>
                  <span>Running Instagram stories</span>
                </li>
              </ul>

              <p className="text-lg font-semibold text-gray-900 pt-4 border-t border-gray-200">
                But you have NO IDEA which one actually drives course sales.
              </p>
            </div>

            {/* Solution */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-success-500" />
                <h2 className="text-3xl font-bold text-gray-900">CourseSignal connects the dots</h2>
              </div>

              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>See which traffic source closed the sale</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>Track full customer journey (first click → purchase)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>Know your real ROI per channel</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>Stop wasting money on vanity metrics</span>
                </li>
              </ul>

              {/* Visual Example */}
              <div className="bg-white p-6 rounded-lg shadow-card border border-gray-200 mt-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-chart-series1/10 text-chart-series1 rounded text-sm font-medium">
                      YouTube
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="px-3 py-1 bg-chart-series2/10 text-chart-series2 rounded text-sm font-medium">
                      Email
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="px-3 py-1 bg-success-100 text-success-700 rounded text-sm font-medium">
                      Purchase
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">= $1,497</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Comparison - ComparisonSlider */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Google Analytics Tells You Clicks. We Tell You Revenue.
            </h2>
            <p className="text-xl text-gray-600">
              See the difference between generic analytics and course creator-specific attribution
            </p>
          </div>
          <ComparisonSlider />
        </div>
      </section>

      {/* Launch Tracking Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Track Every Launch. Compare Every Promotion.
            </h2>
            <p className="text-xl text-gray-600">
              Course creators use CourseSignal to optimize Black Friday, cart open periods, and seasonal promotions. See what they're achieving—then share your own results.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Leaderboard (60%) */}
            <div className="lg:col-span-3">
              <LaunchLeaderboard />
            </div>

            {/* Right: Feature Explainer (40%) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-card p-8 border border-gray-200 h-full">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Track Launches?</h3>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-chart-series1/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-chart-series1" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Compare Performance</p>
                      <p className="text-sm text-gray-600">Black Friday 2024 vs. Summer 2023—see what works</p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-success-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Real-Time Metrics</p>
                      <p className="text-sm text-gray-600">30-second updates during active launches</p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-chart-series2/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-chart-series2" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Share Public Recaps</p>
                      <p className="text-sm text-gray-600">Build social proof with launch results pages</p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-warning-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Auto-Assign Purchases</p>
                      <p className="text-sm text-gray-600">No manual work—revenue tracked automatically</p>
                    </div>
                  </li>
                </ul>

                <Button fullWidth onClick={handleGetStarted}>
                  Track Your Next Launch
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Set goals, track progress, share results
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ROICalculator onGetStarted={handleGetStarted} />
        </div>
      </section>

      {/* Live Match Rate Widget */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <LiveMatchRateWidget />
        </div>
      </section>

      {/* Social Proof Metrics */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Course Creators Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              Real data from real course creators using CourseSignal
            </p>
          </div>
          <SocialProofMetrics />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get attribution data in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 -z-10"></div>

            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-8 border border-gray-100 h-full">
                <div className="absolute -top-6 left-8 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                  01
                </div>

                <div className="mt-8 mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Rocket className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Connect your course platform</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 font-medium">2 minutes</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  Kajabi • Teachable • Stripe
                </p>
                <p className="text-sm text-gray-500">
                  OAuth login. 60 seconds to connect.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-8 border border-gray-100 h-full">
                <div className="absolute -top-6 left-8 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                  02
                </div>

                <div className="mt-8 mb-4">
                  <div className="w-16 h-16 bg-chart-series2/10 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-chart-series2" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">We track every visitor</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 font-medium">5 minutes</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  Automatic tracking script
                </p>
                <p className="text-sm text-gray-500">
                  No code required. Copy-paste into footer.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-8 border border-gray-100 h-full">
                <div className="absolute -top-6 left-8 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                  03
                </div>

                <div className="mt-8 mb-4">
                  <div className="w-16 h-16 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                    <DollarSign className="w-8 h-8 text-success-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">See which marketing drove revenue</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 font-medium">10 minutes</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  Real-time dashboard + launch tracking
                </p>
                <p className="text-sm text-gray-500">
                  Revenue attribution by source—for every launch and every day. Updates live.
                </p>
              </div>
            </div>
          </div>

          {/* Total time callout */}
          <div className="mt-12 text-center">
            <div className="inline-block px-6 py-3 bg-success-100 text-success-700 rounded-lg">
              <span className="font-semibold">Total setup time: 17 minutes to first attribution data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 mb-6">Lock in early adopter rates forever</p>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning-100 text-warning-800 rounded-lg border border-warning-200">
              <Zap className="w-5 h-5" />
              <span className="font-medium">
                Lock in these rates forever as one of our first 100 customers
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Tier */}
            <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Solo Creator</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$49</span>
                <span className="text-gray-600">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">1 website</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">1 platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">1 team member</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Launch reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Email support</span>
                </li>
              </ul>

              <Button fullWidth onClick={handleGetStarted}>
                Start Trial
              </Button>
            </div>

            {/* Pro Tier (Most Popular) */}
            <div className="bg-white rounded-lg shadow-elevated p-8 border-2 border-primary-500 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white rounded-full text-sm font-medium shadow-lg">
                MOST POPULAR ⭐
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-gray-900">Growing Brand</h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-warning-100 text-warning-700 rounded text-xs font-medium">
                  <Rocket className="w-3 h-3" />
                  <span>Popular for Launches</span>
                </div>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$99</span>
                <span className="text-gray-600">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">5 websites</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">All platforms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">5 team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Launch reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Priority email</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Custom UTMs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">API access</span>
                </li>
              </ul>

              <Button fullWidth onClick={handleGetStarted}>
                Start Trial
              </Button>
            </div>

            {/* Premium Tier */}
            <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Course Business</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$199</span>
                <span className="text-gray-600">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Unlimited websites</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">All platforms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Unlimited team</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Launch reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Dedicated manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">White label</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Custom models</span>
                </li>
              </ul>

              <Button fullWidth variant="secondary">
                Contact Sales
              </Button>
            </div>
          </div>

          {/* Match Rate Guarantee */}
          <div className="mt-12 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-card border-2 border-success-200">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-success-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 mb-2">85% Match Rate Guarantee</h4>
                <p className="text-sm text-gray-600">
                  We guarantee 85%+ of purchases will be matched to a marketing source.
                  If you're below 80% after 30 days, we'll extend your trial until we hit it.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-8">
            All plans: 14-day free trial • No credit card • Cancel anytime
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Course Creators Love CourseSignal
            </h2>
            <p className="text-xl text-gray-600">
              See how they discovered which marketing actually drives revenue
            </p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Will my price increase?',
                a: 'No. Lock in your rate forever as an early adopter. Once we reach 100 customers, new customers pay higher rates. Your rate never changes as long as you maintain continuous service.',
              },
              {
                q: 'How long does setup take?',
                a: '2 minutes. OAuth connection + automatic tracking script. No developer required.',
              },
              {
                q: 'Do I need to install tracking codes?',
                a: 'Just one simple script in your site footer. Works with Kajabi, Teachable, custom domains.',
              },
              {
                q: 'What if I use multiple platforms?',
                a: 'Pro and Premium plans support multiple platforms. Track Kajabi + Teachable + Stripe simultaneously.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel from dashboard, effective immediately. No long-term contracts.',
              },
              {
                q: 'Can I track specific launches or promotions?',
                a: 'Yes! Create unlimited launches with start/end dates, set revenue goals, get real-time metrics during active promotions, and compare performance across launches. Share public recap pages to showcase your results and build social proof.',
              },
              {
                q: 'Do you integrate with [platform]?',
                a: 'Currently: Kajabi, Teachable, Stripe. Coming soon: Thinkific, Podia, Gumroad.',
              },
            ].map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span className="font-medium text-gray-900">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-600">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-900 via-primary-800 to-chart-series6 text-white relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Stop guessing. Start knowing.</h2>
          <p className="text-xl mb-10 text-primary-100">
            Join the first 100 course creators who actually know which marketing drives revenue.
          </p>

          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-white text-primary-900 hover:bg-gray-100 text-lg px-12 py-4 mb-6"
          >
            Start 14-Day Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <p className="text-primary-200 text-sm">
            No credit card required • Lock in early pricing
          </p>

          <p className="mt-8 text-sm text-primary-300">
            Questions? Email hello@coursesignal.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold text-white">CourseSignal</span>
              <p className="mt-4 text-sm">
                Revenue attribution for course creators.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2025 CourseSignal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
