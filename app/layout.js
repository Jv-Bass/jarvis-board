import './globals.css'

export const metadata = {
  title: 'Jarvis-Board | Task Management',
  description: 'AI-Powered Task Management Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
