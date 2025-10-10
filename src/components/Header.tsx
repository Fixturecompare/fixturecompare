export default function Header() {
  return (
    <header className="bg-white/60 backdrop-blur-md border-b border-[#A9D0FF] sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-3xl font-bold font-montserrat bg-accent-gradient bg-clip-text text-transparent">Fixture Compare</span>
          </div>
        </div>
      </div>
    </header>
  )
}
