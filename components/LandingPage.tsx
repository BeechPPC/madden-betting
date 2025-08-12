import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import * as LucideIcons from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "../contexts/AuthContext"
import { useRouter } from "next/router"

export default function LandingPage() {
  const { signIn, signInExisting, loading } = useAuth()
  const router = useRouter()

  const handleSignIn = async () => {
    try {
      console.log('=== SIGN IN CLICKED ===');
      console.log('Starting sign in process...');
      await signInExisting()
      console.log('Sign in successful, waiting before redirect...');
      // Wait for AuthContext to finish loading user data before redirecting
      // This prevents race conditions where redirect happens before leagues are loaded
      setTimeout(() => {
        console.log('Redirecting to index page...');
        router.push('/')
      }, 1000)
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  const handleCreateAccount = async () => {
    try {
      await signIn()
      // After successful sign in, redirect to role selection page
      router.push('/role-selection')
    } catch (error) {
      console.error('Error creating account:', error)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 lg:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative">
              <LucideIcons.Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">ClutchPicks</span>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-6">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-slate-800/50 text-sm px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              onClick={handleSignIn}
            >
              Sign In
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm px-6 py-2 rounded-lg shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/40"
              onClick={handleCreateAccount}
            >
              Join or Create League
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 lg:py-32 relative">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 sm:space-y-10">
              <div className="space-y-6">
                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/40 text-sm px-4 py-2 rounded-full shadow-lg shadow-emerald-500/10 animate-fade-in">
                  Next-Gen CFM Betting
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
                  Elevate Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-400 animate-gradient">
                    Madden CFM
                  </span>{" "}
                  Experience
                </h1>
                <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
                  The ultimate platform for Connected Franchise Mode betting. Place bets, AI game breakdowns, and weekly recaps and compete with
                  CFM league in the most advanced Madden betting ecosystem.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <Button 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-8 py-4 text-lg rounded-xl shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/40"
                  onClick={handleCreateAccount}
                >
                  Join or Create League
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800/50 bg-slate-900/50 backdrop-blur-sm px-8 py-4 text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:border-emerald-500/50"
                  onClick={handleSignIn}
                >
                  Sign In
                </Button>
              </div>
              <div className="flex items-center space-x-8 sm:space-x-12 text-slate-400 text-base sm:text-lg">
                <div className="flex items-center space-x-3 group">
                  <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-emerald-500/20 transition-colors duration-300">
                    <LucideIcons.Users className="h-5 w-5 sm:h-6 sm:w-6 group-hover:text-emerald-400 transition-colors duration-300" />
                  </div>
                  <span className="group-hover:text-white transition-colors duration-300">10K+ Users</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-emerald-500/20 transition-colors duration-300">
                    <LucideIcons.TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 group-hover:text-emerald-400 transition-colors duration-300" />
                  </div>
                  <span className="group-hover:text-white transition-colors duration-300">$2M+ Wagered</span>
                </div>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 via-blue-600/30 to-emerald-600/30 rounded-3xl blur-3xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
                <Image
                  src="/header.png"
                  alt="Madden CFM Betting Dashboard"
                  width={600}
                  height={600}
                  className="rounded-2xl w-full h-auto shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-gradient-to-b from-slate-900/50 to-slate-800/30 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-emerald-500/5"></div>
        <div className="container mx-auto px-4 lg:px-6 relative">
          <div className="text-center space-y-6 mb-16 sm:mb-20">
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40 text-sm px-4 py-2 rounded-full shadow-lg shadow-blue-500/10">Features</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white">Bet the Game, Beat the League</h2>
            <p className="text-lg sm:text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Advanced analytics, real-time betting, and comprehensive league management tools designed for serious CFM
              players.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-emerald-500/50 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-xl shadow-black/20 group">
              <CardHeader className="pb-6">
                <div className="p-4 bg-emerald-500/10 rounded-2xl w-fit group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <LucideIcons.BarChart3 className="h-12 w-12 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl text-white group-hover:text-emerald-300 transition-colors duration-300">Advanced Analytics</CardTitle>
                <CardDescription className="text-slate-300 leading-relaxed">
                  Deep dive into player stats, team performance, and betting trends with our AI-powered analytics
                  engine.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-xl shadow-black/20 group">
              <CardHeader className="pb-6">
                <div className="p-4 bg-blue-500/10 rounded-2xl w-fit group-hover:bg-blue-500/20 transition-colors duration-300">
                  <LucideIcons.Zap className="h-12 w-12 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl text-white group-hover:text-blue-300 transition-colors duration-300">Coming Soon...</CardTitle>
                <CardDescription className="text-slate-300 leading-relaxed">
                  Place bets on live games with instant updates and dynamic odds that adjust based on game performance.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-emerald-500/50 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-xl shadow-black/20 group">
              <CardHeader className="pb-6">
                <div className="p-4 bg-emerald-500/10 rounded-2xl w-fit group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <LucideIcons.Shield className="h-12 w-12 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl text-white group-hover:text-emerald-300 transition-colors duration-300">Coming Soon...</CardTitle>
                <CardDescription className="text-slate-300 leading-relaxed">
                  Bank-level security with encrypted transactions and secure wallet management for all your bets.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-emerald-500/50 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-xl shadow-black/20 group">
              <CardHeader className="pb-6">
                <div className="p-4 bg-emerald-500/10 rounded-2xl w-fit group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <LucideIcons.Users className="h-12 w-12 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl text-white group-hover:text-emerald-300 transition-colors duration-300">Coming Soon...</CardTitle>
                <CardDescription className="text-slate-300 leading-relaxed">
                  Create and manage betting pools with friends, track leaderboards, and organise tournaments.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-xl shadow-black/20 group">
              <CardHeader className="pb-6">
                <div className="p-4 bg-blue-500/10 rounded-2xl w-fit group-hover:bg-blue-500/20 transition-colors duration-300">
                  <LucideIcons.TrendingUp className="h-12 w-12 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl text-white group-hover:text-blue-300 transition-colors duration-300">Coming Soon...</CardTitle>
                <CardDescription className="text-slate-300 leading-relaxed">
                  Monitor your betting history, win rates, and ROI with comprehensive performance dashboards.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-xl shadow-black/20 group">
              <CardHeader className="pb-6">
                <div className="p-4 bg-blue-500/10 rounded-2xl w-fit group-hover:bg-blue-500/20 transition-colors duration-300">
                  <LucideIcons.Star className="h-12 w-12 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl text-white group-hover:text-blue-300 transition-colors duration-300">Coming Soon...</CardTitle>
                <CardDescription className="text-slate-300 leading-relaxed">
                  Get AI-generated predictions and expert analysis to make informed betting decisions.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800/30 to-slate-900/50"></div>
        <div className="container mx-auto px-4 lg:px-6 relative">
          <div className="text-center space-y-6 mb-16 sm:mb-20">
            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/40 text-sm px-4 py-2 rounded-full shadow-lg shadow-emerald-500/10">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white">Simple Pay Per League</h2>
            <p className="text-lg sm:text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Pay once per league and unlock all premium features for that league forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 relative backdrop-blur-sm shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 transition-all duration-500 hover:scale-105 group">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl text-white group-hover:text-slate-200 transition-colors duration-300">Join a League</CardTitle>
                <div className="text-5xl font-bold text-white mt-6">
                  Free<span className="text-xl text-slate-400"></span>
                </div>
                <CardDescription className="text-slate-300 mt-4 text-lg">
                  Join as many leagues as you like
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    <div className="p-1 bg-emerald-500/20 rounded-full mr-4">
                      <LucideIcons.Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    Basic betting features
                  </li>
                  <li className="flex items-center text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    <div className="p-1 bg-emerald-500/20 rounded-full mr-4">
                      <LucideIcons.Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    Join up to 1 league
                  </li>
                  <li className="flex items-center text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    <div className="p-1 bg-emerald-500/20 rounded-full mr-4">
                      <LucideIcons.Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    Basic analytics
                  </li>
                  <li className="flex items-center text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    <div className="p-1 bg-emerald-500/20 rounded-full mr-4">
                      <LucideIcons.Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    Community support
                  </li>
                </ul>
                <Button 
                  className="w-full mt-8 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white py-4 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={handleCreateAccount}
                >
                  Join a League
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-gradient-to-br from-emerald-900/50 via-blue-900/30 to-emerald-900/50 border-emerald-500/50 relative backdrop-blur-sm shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-500 hover:scale-105 group">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-2 rounded-full shadow-lg shadow-emerald-500/25">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-3xl text-white group-hover:text-emerald-200 transition-colors duration-300">Per League</CardTitle>
                <div className="text-5xl font-bold text-white mt-6">
                  $4.99<span className="text-xl text-slate-400">usd</span>
                </div>
                <CardDescription className="text-slate-300 mt-4 text-lg">
                  One-time payment unlocks all features for that league
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    <div className="p-1 bg-emerald-500/20 rounded-full mr-4">
                      <LucideIcons.Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    Admin of league
                  </li>
                  <li className="flex items-center text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    <div className="p-1 bg-emerald-500/20 rounded-full mr-4">
                      <LucideIcons.Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    Access to our Discord server
                  </li>
                  <li className="flex items-center text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    <div className="p-1 bg-emerald-500/20 rounded-full mr-4">
                      <LucideIcons.Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    AI-powered insights & predictions
                  </li>
                  <li className="flex items-center text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    <div className="p-1 bg-emerald-500/20 rounded-full mr-4">
                      <LucideIcons.Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    Real-time notifications
                  </li>
                  <li className="flex items-center text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    <div className="p-1 bg-emerald-500/20 rounded-full mr-4">
                      <LucideIcons.Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    Priority support
                  </li>
                  <li className="flex items-center text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    <div className="p-1 bg-emerald-500/20 rounded-full mr-4">
                      <LucideIcons.Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    All future features included
                  </li>
                </ul>
                <Button 
                  className="w-full mt-8 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white py-4 text-lg rounded-xl shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/40"
                  onClick={handleCreateAccount}
                >
                  Create a League
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-800/50 to-slate-900/50 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-emerald-500/5"></div>
        <div className="container mx-auto px-4 lg:px-6 relative">
          <div className="text-center space-y-6 mb-16 sm:mb-20">
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40 text-sm px-4 py-2 rounded-full shadow-lg shadow-blue-500/10">Contact</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white">Get in Touch</h2>
            <p className="text-lg sm:text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Have questions about ClutchPicks? We&apos;re here to help you dominate your CFM leagues.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 max-w-7xl mx-auto">
            <div className="space-y-10">
              <div className="space-y-8">
                <div className="flex items-start space-x-6 group">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors duration-300">
                    <LucideIcons.Mail className="h-8 w-8 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl group-hover:text-emerald-300 transition-colors duration-300">Email</h3>
                    <p className="text-slate-300 text-lg group-hover:text-slate-200 transition-colors duration-300">support@maddenbetpro.com</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6 group">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors duration-300">
                    <LucideIcons.Phone className="h-8 w-8 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl group-hover:text-emerald-300 transition-colors duration-300">Phone</h3>
                    <p className="text-slate-300 text-lg group-hover:text-slate-200 transition-colors duration-300">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6 group">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors duration-300">
                    <LucideIcons.MapPin className="h-8 w-8 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl group-hover:text-emerald-300 transition-colors duration-300">Address</h3>
                    <p className="text-slate-300 text-lg group-hover:text-slate-200 transition-colors duration-300">
                      123 Gaming Street
                      <br />
                      Tech City, TC 12345
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm shadow-xl shadow-black/20">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-white">Send us a message</CardTitle>
                <CardDescription className="text-slate-300 text-lg">We&apos;ll get back to you within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-slate-300 mb-3 block font-medium">First Name</label>
                    <Input className="bg-slate-700/50 border-slate-600 text-white rounded-lg focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-3 block font-medium">Last Name</label>
                    <Input className="bg-slate-700/50 border-slate-600 text-white rounded-lg focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-3 block font-medium">Email</label>
                  <Input type="email" className="bg-slate-700/50 border-slate-600 text-white rounded-lg focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-3 block font-medium">Message</label>
                  <Textarea className="bg-slate-700/50 border-slate-600 text-white rounded-lg focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300 min-h-[140px]" />
                </div>
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white py-4 text-lg rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/40">Send Message</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-6 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0 group cursor-pointer">
              <div className="relative">
                <LucideIcons.Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">ClutchPicks</span>
            </div>
            <div className="flex space-x-6 sm:space-x-8 text-slate-400 text-sm sm:text-base">
              <Link href="#" className="hover:text-white transition-colors duration-300 hover:scale-105">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-white transition-colors duration-300 hover:scale-105">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-white transition-colors duration-300 hover:scale-105">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-slate-800/50 text-center text-slate-400 text-sm sm:text-base">
            <p>&copy; {new Date().getFullYear()} ClutchPicks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 