export default function Header() {
  return (
    <header className="bg-white/60 backdrop-blur-md border-b border-[#A9D0FF] sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/fixture-compare-logo.jpg"
              alt="Fixture Compare Logo"
              className="h-10 w-auto md:h-12"
            />
          </div>
        </div>
      </div>
    </header>
  )
}