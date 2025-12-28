import type React from "react"
import { Suspense } from "react"
import { LandingNav } from "@/components/landing-nav"
import { Hero3D } from "@/components/hero-3d"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Shield, Search, BrainCircuit } from "lucide-react"
import Link from "next/link"
import AuthRedirect from "@/components/AuthRedirect"

export default function Home() {
  return (
    <Suspense fallback={null}>
      <main className="min-h-screen relative flex flex-col">
        <AuthRedirect />
        <LandingNav />
        <Hero3D />

        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Zap className="h-4 w-4" />
              Next-Gen AI Document Analysis
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              Your Documents, <br />
              <span className="text-primary">Supercharged by AI</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Extract insights, summarize complex papers, and chat with your PDFs in real-time. Stop reading, start
              understanding with PDF IQ.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="h-12 px-8 text-base gap-2 rounded-full" asChild>
                <Link href="/login">
                  Try it Now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full bg-transparent">
                Watch Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-background/50 backdrop-blur-xl border-t border-border/40 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Search className="h-6 w-6 text-primary" />}
                title="Semantic Search"
                description="Find exact information across thousands of pages instantly using natural language queries."
              />
              <FeatureCard
                icon={<BrainCircuit className="h-6 w-6 text-primary" />}
                title="Intelligent Synthesis"
                description="Automatically generate summaries, bullet points, and actionable insights from any document."
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6 text-primary" />}
                title="Enterprise Security"
                description="Your data is encrypted and protected with industry-leading security protocols."
              />
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-border/40 text-center text-muted-foreground text-sm">
          <p>© 2025 PDF IQ. Built for the future of knowledge work.</p>
        </footer>
      </main>
    </Suspense>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-border/40 bg-card/50 hover:bg-card hover:border-primary/30 transition-all group duration-300">
      <div className="mb-4 p-3 rounded-xl bg-primary/10 w-fit group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
