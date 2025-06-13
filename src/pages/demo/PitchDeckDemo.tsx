import React, { useState, useEffect } from 'react';
import { ChevronRight, Home, Users, Wrench, Bell, MessageSquare, CheckCircle, Clock, AlertCircle, TrendingUp, Calendar, DollarSign, BarChart3, Sparkles, Zap, Shield, Smartphone } from 'lucide-react';
import '../../styles/pitch-demo.css';

interface DemoStep {
  id: number;
  title: string;
  description: string;
  userType: 'landlord' | 'tenant' | 'both';
  visual: React.ReactNode;
}

const PitchDeckDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const demoSteps: DemoStep[] = [
    {
      id: 1,
      title: "AI-Powered Property Management Platform",
      description: "PropAgentic revolutionizes property management with intelligent automation",
      userType: 'both',
      visual: (
        <div className="relative h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative z-10 text-center p-12">
            <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-6 transition-transform">
              <Home className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">PropAgentic</h1>
            <p className="text-xl text-gray-600 mb-8">Intelligent Property Management for Everyone</p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">85%</div>
                <div className="text-sm text-gray-600">Time Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">24/7</div>
                <div className="text-sm text-gray-600">AI Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">100%</div>
                <div className="text-sm text-gray-600">Automated</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Instant Google Sign-Up",
      description: "Tenants and landlords join in seconds with Google OAuth",
      userType: 'both',
      visual: (
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to PropAgentic</h2>
              <p className="text-gray-600 mb-8">Choose your account type to get started</p>
              
              <div className="space-y-4 mb-6">
                <button className="w-full p-4 border-2 border-orange-500 rounded-xl hover:bg-orange-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Home className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold">I'm a Landlord</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
                
                <button className="w-full p-4 border-2 border-teal-500 rounded-xl hover:bg-teal-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-teal-600" />
                      <span className="font-semibold">I'm a Tenant</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              </div>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">Continue with</span>
                </div>
              </div>
              
              <button className="w-full flex items-center justify-center gap-3 p-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-700">Sign up with Google</span>
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Join in seconds • No credit card required
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Landlord Dashboard Overview",
      description: "Complete property management at a glance with AI insights",
      userType: 'landlord',
      visual: (
        <div className="h-full p-6 bg-gray-50 rounded-2xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Welcome back, Sarah!</h3>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">+12%</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">8</div>
                <div className="text-sm text-gray-600">Properties</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Active</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">24</div>
                <div className="text-sm text-gray-600">Tenants</div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Wrench className="w-5 h-5 text-orange-600" />
                  <span className="text-xs text-orange-600 font-medium">Pending</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">3</div>
                <div className="text-sm text-gray-600">Requests</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">98%</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">$45.2k</div>
                <div className="text-sm text-gray-600">Revenue</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">AI Insight</span>
                  </div>
                  <p className="text-sm opacity-90">3 maintenance requests show similar HVAC issues. Consider scheduling a bulk service visit to save 40% on costs.</p>
                </div>
                <button className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Smart Property Invite System",
      description: "Landlords send digital invites, tenants join instantly",
      userType: 'landlord',
      visual: (
        <div className="h-full flex items-center justify-center p-8">
          <div className="grid grid-cols-2 gap-8 max-w-4xl w-full">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite New Tenant</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg">
                    <option>Sunset Apartments - Unit 4B</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Email</label>
                  <input type="email" placeholder="tenant@email.com" className="w-full p-3 border border-gray-300 rounded-lg" />
                </div>
                
                <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow">
                  Send Invite
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Invite Sent!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">Tenant will receive an email with their unique invite code</p>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm">Email Preview</span>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Welcome to Your New Home! 🏠</h4>
                <p className="text-sm text-gray-300 mb-4">
                  Sarah Johnson has invited you to join Sunset Apartments - Unit 4B on PropAgentic.
                </p>
                
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg p-4 text-center mb-4">
                  <p className="text-xs mb-2">Your Invite Code</p>
                  <p className="text-2xl font-mono font-bold">ABCD-1234</p>
                </div>
                
                <button className="w-full bg-white text-gray-900 py-2 rounded-lg text-sm font-medium">
                  Join PropAgentic
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Tenant Smart Dashboard",
      description: "Everything tenants need in one intelligent interface",
      userType: 'tenant',
      visual: (
        <div className="h-full p-6 bg-gray-50 rounded-2xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Good morning, Michael!</h3>
                <p className="text-sm text-gray-600">Sunset Apartments - Unit 4B</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Wrench className="w-6 h-6 text-teal-600" />
                  </div>
                  <span className="text-xs text-teal-600 font-medium">Quick Action</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Request Maintenance</h4>
                <p className="text-sm text-gray-600">Report issues instantly with AI categorization</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-xs text-purple-600 font-medium">Due Soon</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Pay Rent</h4>
                <p className="text-sm text-gray-600">Next payment: March 1st • $1,850</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Maintenance Update</p>
                    <p className="text-sm text-gray-600">Your AC repair is scheduled for tomorrow at 2 PM</p>
                  </div>
                </div>
                <span className="text-xs text-orange-600 font-medium">In Progress</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Request Completed</p>
                    <p className="text-sm text-gray-600">Kitchen faucet has been fixed</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-medium">Resolved</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "AI-Powered Maintenance Requests",
      description: "Smart categorization and instant contractor matching",
      userType: 'tenant',
      visual: (
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Maintenance Request</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What's the issue?</label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-lg h-24" 
                    placeholder="My kitchen sink is leaking..."
                  />
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">AI Analysis</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Category:</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">Plumbing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Urgency:</span>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md font-medium">Medium Priority</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Est. Time:</span>
                          <span className="font-medium text-gray-900">1-2 hours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Add Photo (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <Smartphone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  </div>
                </div>
                
                <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow">
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "Real-Time Status Updates",
      description: "Track maintenance progress with live notifications",
      userType: 'both',
      visual: (
        <div className="h-full p-6 bg-gray-50 rounded-2xl">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Maintenance Timeline</h3>
            
            <div className="relative">
              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-300"></div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="relative z-10 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Request Submitted</h4>
                      <span className="text-sm text-gray-500">2:15 PM</span>
                    </div>
                    <p className="text-sm text-gray-600">Kitchen sink leak reported by tenant</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">AI Categorized: Plumbing</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="relative z-10 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Contractor Assigned</h4>
                      <span className="text-sm text-gray-500">2:18 PM</span>
                    </div>
                    <p className="text-sm text-gray-600">Mike's Plumbing Service accepted the job</p>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <span className="text-sm font-medium">Mike Johnson</span>
                      </div>
                      <span className="text-xs text-gray-500">⭐ 4.8 rating</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="relative z-10 w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Scheduled</h4>
                      <span className="text-sm text-gray-500">2:45 PM</span>
                    </div>
                    <p className="text-sm text-gray-600">Service scheduled for tomorrow at 2:00 PM</p>
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-800">
                        <span className="font-medium">Tenant notified:</span> You'll receive a reminder 1 hour before arrival
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: "Powerful Analytics & Insights",
      description: "Data-driven decisions with predictive maintenance",
      userType: 'landlord',
      visual: (
        <div className="h-full p-6 bg-gray-50 rounded-2xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Property Analytics</h3>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Last 30 Days</option>
              </select>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">89%</div>
                <div className="text-sm text-gray-600">Response Rate</div>
                <div className="text-xs text-blue-600 font-medium mt-1">↑ 12% vs last month</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">4.8</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
                <div className="text-xs text-green-600 font-medium mt-1">Top 10% on platform</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">18h</div>
                <div className="text-sm text-gray-600">Avg Resolution</div>
                <div className="text-xs text-purple-600 font-medium mt-1">↓ 6h improvement</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 text-white">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">AI Prediction</h4>
                    <p className="text-sm opacity-90">3 HVAC units showing similar patterns. Schedule preventive maintenance to avoid $2,400 in emergency repairs.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Compliance Alert</h4>
                    <p className="text-sm text-gray-600">Annual safety inspections due for 3 properties by March 15th</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 9,
      title: "The PropAgentic Advantage",
      description: "Join thousands saving time and money with AI-powered property management",
      userType: 'both',
      visual: (
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8">
          <div className="max-w-4xl w-full text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">Why PropAgentic?</h2>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Save 85% Time</h3>
                <p className="text-sm text-gray-600">Automate repetitive tasks and focus on growing your portfolio</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Reduce Costs 40%</h3>
                <p className="text-sm text-gray-600">Predictive maintenance and bulk scheduling saves thousands</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Happy Tenants</h3>
                <p className="text-sm text-gray-600">24/7 support and instant responses increase retention 65%</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Property Management?</h3>
              <p className="text-lg opacity-90 mb-6">Join 10,000+ landlords and tenants already using PropAgentic</p>
              <div className="flex items-center justify-center gap-4">
                <button className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:shadow-lg transition-shadow">
                  Start Free Trial
                </button>
                <button className="px-8 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors">
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    if (isAutoPlaying && currentStep < demoSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 5000); // 5 seconds per slide
      
      return () => clearTimeout(timer);
    } else if (isAutoPlaying && currentStep === demoSteps.length - 1) {
      // Loop back to start
      const timer = setTimeout(() => {
        setCurrentStep(0);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, isAutoPlaying, demoSteps.length]);

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setIsAutoPlaying(false); // Stop auto-play when user manually navigates
  };

  const currentStepData = demoSteps[currentStep];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">PropAgentic Demo</h1>
                <p className="text-sm text-gray-400">AI-Powered Property Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isAutoPlaying 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {isAutoPlaying ? 'Pause' : 'Play'} Demo
              </button>
              
              <div className="text-sm text-gray-400">
                Step {currentStep + 1} of {demoSteps.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Step Info */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full mb-4">
              <span className={`w-3 h-3 rounded-full ${
                currentStepData.userType === 'landlord' ? 'bg-orange-500' : 
                currentStepData.userType === 'tenant' ? 'bg-teal-500' : 
                'bg-gradient-to-r from-orange-500 to-teal-500'
              }`}></span>
              <span className="text-sm font-medium">
                {currentStepData.userType === 'both' ? 'All Users' : 
                 currentStepData.userType === 'landlord' ? 'Landlord View' : 'Tenant View'}
              </span>
            </div>
            
            <h2 className="text-3xl font-bold mb-2">{currentStepData.title}</h2>
            <p className="text-xl text-gray-400">{currentStepData.description}</p>
          </div>

          {/* Visual Display */}
          <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden" style={{ height: '600px' }}>
            {currentStepData.visual}
          </div>

          {/* Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {demoSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-orange-500 w-8' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              © 2024 PropAgentic. Transforming property management with AI.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                propAgentic.com
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitchDeckDemo; 