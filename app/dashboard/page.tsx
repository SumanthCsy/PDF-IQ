"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { PDFUpload } from "@/components/pdf-upload"
import { AIChatInterface } from "@/components/ai-chat-interface"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import {
  FileText,
  Layout,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Maximize2,
  Plus,
  MessageSquare,
  User,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedPDF {
  url: string
  pathname: string
  contentType: string
  size: number
}

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [uploadedPDF, setUploadedPDF] = useState<UploadedPDF | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [userPDFs, setUserPDFs] = useState<any[]>([])
  const [loadingPDFs, setLoadingPDFs] = useState(true)
  const { currentUser, userDoc, logout } = useAuth()

  useEffect(() => {
    const fetchUserPDFs = async () => {
      if (currentUser) {
        try {
          setLoadingPDFs(true);
          // Import the function here to avoid server-side issues
          const { getUserPDFs } = await import('@/lib/firebase');
          const pdfs = await getUserPDFs(currentUser.uid);
          setUserPDFs(pdfs);
        } catch (error) {
          console.error('Error fetching user PDFs:', error);
        } finally {
          setLoadingPDFs(false);
        }
      }
    };

    fetchUserPDFs();
  }, [currentUser]);

  const handleUploadComplete = (data: UploadedPDF) => {
    console.log("[v0] Upload complete:", data)
    setUploadedPDF(data)
    setShowAIPanel(true)
    
    // Refresh the user's PDF list
    if (currentUser) {
      const fetchUserPDFs = async () => {
        try {
          const { getUserPDFs } = await import('@/lib/firebase');
          const pdfs = await getUserPDFs(currentUser.uid);
          setUserPDFs(pdfs);
        } catch (error) {
          console.error('Error fetching user PDFs:', error);
        }
      };
      fetchUserPDFs();
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar - Navigation */}
        <aside
          className={cn(
            "flex flex-col border-r border-border/40 bg-card/30 backdrop-blur-xl transition-all duration-300",
            sidebarCollapsed ? "w-16" : "w-64",
          )}
        >
          <div className="p-4 flex items-center justify-between border-b border-border/40">
            {!sidebarCollapsed && (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="PDF IQ Logo" className="h-6 w-6" />
                  <span className="font-bold text-lg tracking-tight text-primary">PDF IQ</span>
                </div>
                {userDoc?.displayName && (
                  <span className="text-xs text-muted-foreground">Welcome, {userDoc.displayName}!</span>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <ScrollArea className="flex-1 px-2 py-4">
            <div className="space-y-1">
              <SidebarItem
                icon={<Plus className="h-4 w-4" />}
                label="New Analysis"
                collapsed={sidebarCollapsed}
                active={!uploadedPDF}
              />
              <SidebarItem icon={<History className="h-4 w-4" />} label="Recent Files" collapsed={sidebarCollapsed} />
              <SidebarItem icon={<Layout className="h-4 w-4" />} label="Workspace" collapsed={sidebarCollapsed} />
            </div>

            <div className="mt-8">
              {!sidebarCollapsed && (
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase mb-2">Recent Files</p>
              )}
              <div className="space-y-1">
                {loadingPDFs ? (
                  <div className="px-4 py-2">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                  </div>
                ) : userPDFs.length > 0 ? (
                  userPDFs.map((pdf) => (
                    <SidebarItem
                      key={pdf.id}
                      icon={<FileText className="h-4 w-4" />}
                      label={pdf.filename || pdf.pathname}
                      collapsed={sidebarCollapsed}
                      active={uploadedPDF && (uploadedPDF.pathname === pdf.pathname)}
                      onClick={() => {
                        setUploadedPDF({
                          url: pdf.url,
                          pathname: pdf.pathname,
                          contentType: pdf.contentType,
                          size: pdf.size
                        });
                        setShowAIPanel(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    {sidebarCollapsed ? 'No files' : 'No PDFs uploaded yet'}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border/40 space-y-1">
            <SidebarItem icon={<User className="h-4 w-4" />} label={currentUser?.email?.split('@')[0] || 'Profile'} collapsed={sidebarCollapsed} />
            <SidebarItem 
              icon={<LogOut className="h-4 w-4" />} 
              label="Logout" 
              collapsed={sidebarCollapsed}
              onClick={logout}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {!uploadedPDF ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">Upload a PDF to get started</h2>
                  <p className="text-muted-foreground">
                    Upload any PDF document and start chatting with AI to extract insights instantly
                  </p>
                </div>
                <PDFUpload onUploadComplete={handleUploadComplete} />
              </div>
            </div>
          ) : (
            <>
              {/* Top Header */}
              <header className="h-14 border-b border-border/40 flex items-center justify-between px-6 bg-background/50 backdrop-blur-md">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate">{uploadedPDF.pathname}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showAIPanel ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    AI Chat
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </header>

              {/* Viewer Container */}
              <div className="flex-1 bg-muted/30 p-8 overflow-auto flex justify-center">
                <div className="w-full max-w-[850px] bg-white rounded-lg shadow-2xl min-h-[1200px]">
                  <iframe src={uploadedPDF.url} className="w-full h-full min-h-[1200px] rounded-lg" title="PDF Viewer" />
                </div>
              </div>
            </>
          )}
        </main>

        {showAIPanel && uploadedPDF && (
          <aside className="w-[400px] border-l border-border/40 flex flex-col bg-card/20 backdrop-blur-xl">
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAIPanel(false)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIChatInterface pdfUrl={uploadedPDF.url} pdfContext={`Analyzing PDF: ${uploadedPDF.pathname}`} />
            </div>
          </aside>
        )}
      </div>
    </ProtectedRoute>
  )
}

function SidebarItem({
  icon,
  label,
  collapsed,
  active = false,
  onClick,
}: { 
  icon: React.ReactNode; 
  label: string; 
  collapsed: boolean; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
      onClick={onClick}
    >
      <div className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-primary")}>
        {icon}
      </div>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  )
}
