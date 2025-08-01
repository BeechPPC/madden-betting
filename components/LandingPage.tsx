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
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSignIn = () => {
    router.push('/login')
  }

  const handleCreateAccount = async () => {
    try {
      await signIn()
    } catch (error) {
      console.error('Error creating account:', error)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LucideIcons.Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
            <span className="text-lg sm:text-xl font-bold text-white">ClutchPicks</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-slate-700 text-xs sm:text-sm px-2 sm:px-4"
              onClick={handleSignIn}
            >
              Sign In
            </Button>
            <Button 
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm px-2 sm:px-4"
              onClick={handleCreateAccount}
            >
              Create Account
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4">
                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs sm:text-sm">Next-Gen CFM Betting</Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-tight">
                  Elevate Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                    Madden CFM
                  </span>{" "}
                  Experience
                </h1>
                <p className="text-base sm:text-xl text-slate-300 leading-relaxed">
                  The ultimate platform for Connected Franchise Mode betting. Place bets, AI game breakdowns, and weekly recaps and compete with
                  CFM league in the most advanced Madden betting ecosystem.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
                  onClick={handleCreateAccount}
                >
                  Create League Now
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Sign In
                </Button>
              </div>
              <div className="flex items-center space-x-4 sm:space-x-8 text-slate-400 text-sm sm:text-base">
                <div className="flex items-center space-x-2">
                  <LucideIcons.Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>10K+ Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <LucideIcons.TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>$2M+ Wagered</span>
                </div>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-3xl blur-3xl"></div>
              <Image
                src="/placeholder.svg?height=600&width=600"
                alt="MaddenBet Pro Dashboard"
                width={600}
                height={600}
                className="relative rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 bg-slate-800/50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs sm:text-sm">Features</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white">Bet the Game, Beat the League</h2>
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto">
              Advanced analytics, real-time betting, and comprehensive league management tools designed for serious CFM
              players.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-600/50 transition-colors">
              <CardHeader>
                <LucideIcons.BarChart3 className="h-12 w-12 text-emerald-400 mb-4" />
                <CardTitle className="text-white">Advanced Analytics</CardTitle>
                <CardDescription className="text-slate-300">
                  Deep dive into player stats, team performance, and betting trends with our AI-powered analytics
                  engine.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-600/50 transition-colors">
              <CardHeader>
                <LucideIcons.Zap className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">Real-Time Betting</CardTitle>
                <CardDescription className="text-slate-300">
                  Place bets on live games with instant updates and dynamic odds that adjust based on game performance.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-600/50 transition-colors">
              <CardHeader>
                <LucideIcons.Shield className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Secure Transactions</CardTitle>
                <CardDescription className="text-slate-300">
                  Bank-level security with encrypted transactions and secure wallet management for all your bets.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-600/50 transition-colors">
              <CardHeader>
                <LucideIcons.Users className="h-12 w-12 text-emerald-400 mb-4" />
                <CardTitle className="text-white">League Management</CardTitle>
                <CardDescription className="text-slate-300">
                  Create and manage betting pools with friends, track leaderboards, and organise tournaments.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-600/50 transition-colors">
              <CardHeader>
                <LucideIcons.TrendingUp className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">Performance Tracking</CardTitle>
                <CardDescription className="text-slate-300">
                  Monitor your betting history, win rates, and ROI with comprehensive performance dashboards.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-600/50 transition-colors">
              <CardHeader>
                <LucideIcons.Star className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Expert Insights</CardTitle>
                <CardDescription className="text-slate-300">
                  Get AI-generated predictions and expert analysis to make informed betting decisions.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs sm:text-sm">Pricing</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white">Choose Your Game Plan</h2>
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto">
              Start free and upgrade when you&apos;re ready to unlock the full potential of CFM betting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-slate-800/50 border-slate-700 relative">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-white">Free</CardTitle>
                <div className="text-4xl font-bold text-white mt-4">
                  $0<span className="text-lg text-slate-400">/month</span>
                </div>
                <CardDescription className="text-slate-300 mt-2">
                  Perfect for getting started with CFM betting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center text-slate-300">
                    <LucideIcons.Check className="h-5 w-5 text-emerald-400 mr-3" />
                    Basic betting features
                  </li>
                  <li className="flex items-center text-slate-300">
                    <LucideIcons.Check className="h-5 w-5 text-emerald-400 mr-3" />
                    Join up to 3 leagues
                  </li>
                  <li className="flex items-center text-slate-300">
                    <LucideIcons.Check className="h-5 w-5 text-emerald-400 mr-3" />
                    Basic analytics
                  </li>
                  <li className="flex items-center text-slate-300">
                    <LucideIcons.Check className="h-5 w-5 text-emerald-400 mr-3" />
                    Community support
                  </li>
                </ul>
                <Button 
                  className="w-full mt-8 bg-slate-700 hover:bg-slate-600 text-white py-2 sm:py-3 text-sm sm:text-base"
                  onClick={handleCreateAccount}
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-gradient-to-br from-emerald-900/50 to-blue-900/50 border-emerald-600/50 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-emerald-600 text-white px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-white">Premium</CardTitle>
                <div className="text-4xl font-bold text-white mt-4">
                  $9.99<span className="text-lg text-slate-400">/one-time</span>
                </div>
                <CardDescription className="text-slate-300 mt-2">
                  Unlock the full power of advanced CFM betting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center text-slate-300">
                    <LucideIcons.Check className="h-5 w-5 text-emerald-400 mr-3" />
                    All free features included
                  </li>
                  <li className="flex items-center text-slate-300">
                    <LucideIcons.Check className="h-5 w-5 text-emerald-400 mr-3" />
                    Unlimited leagues
                  </li>
                  <li className="flex items-center text-slate-300">
                    <LucideIcons.Check className="h-5 w-5 text-emerald-400 mr-3" />
                    AI insights
                  </li>
                  <li className="flex items-center text-slate-300">
                    <LucideIcons.Check className="h-5 w-5 text-emerald-400 mr-3" />
                    Real-time notifications
                  </li>
                  <li className="flex items-center text-slate-300">
                    <LucideIcons.Check className="h-5 w-5 text-emerald-400 mr-3" />
                    Priority support
                  </li>
                  <li className="flex items-center text-slate-300">
                    <LucideIcons.Check className="h-5 w-5 text-emerald-400 mr-3" />
                    All future features included
                  </li>
                </ul>
                <Button 
                  className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white py-2 sm:py-3 text-sm sm:text-base"
                  onClick={handleCreateAccount}
                >
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-20 bg-slate-800/50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs sm:text-sm">Contact</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white">Get in Touch</h2>
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto">
              Have questions about ClutchPicks? We&apos;re here to help you dominate your CFM leagues.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <LucideIcons.Mail className="h-6 w-6 text-emerald-400 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">Email</h3>
                    <p className="text-slate-300">support@maddenbetpro.com</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <LucideIcons.Phone className="h-6 w-6 text-emerald-400 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">Phone</h3>
                    <p className="text-slate-300">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <LucideIcons.MapPin className="h-6 w-6 text-emerald-400 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">Address</h3>
                    <p className="text-slate-300">
                      123 Gaming Street
                      <br />
                      Tech City, TC 12345
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Send us a message</CardTitle>
                <CardDescription className="text-slate-300">We&apos;ll get back to you within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">First Name</label>
                    <Input className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Last Name</label>
                    <Input className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Email</label>
                  <Input type="email" className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Message</label>
                  <Textarea className="bg-slate-700 border-slate-600 text-white min-h-[120px]" />
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 sm:py-3 text-sm sm:text-base">Send Message</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900">
        <div className="container mx-auto px-4 lg:px-6 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <LucideIcons.Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
              <span className="text-base sm:text-lg font-bold text-white">MaddenBet Pro</span>
            </div>
            <div className="flex space-x-4 sm:space-x-6 text-slate-400 text-xs sm:text-sm">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-700/50 text-center text-slate-400 text-xs sm:text-sm">
            <p>&copy; {new Date().getFullYear()} MaddenBet Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 