import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "PBDriveKing — AI Pickleball Swing Analyzer",
  description:
    "Analyze your Pickleball drive with dual-camera AI pose estimation. Get real-time biomechanical feedback and pro coaching tips.",
  keywords: [
    "pickleball",
    "swing analysis",
    "AI coaching",
    "biomechanics",
    "pose estimation",
  ],
  openGraph: {
    title: "PBDriveKing — AI Pickleball Swing Analyzer",
    description:
      "Dual-camera AI-powered Pickleball drive analysis with pro coaching feedback.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
