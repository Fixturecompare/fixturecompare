export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-3xl font-bold text-gray-900 font-montserrat">Fixture Compare</span>
          </div>
        </div>
      </div>
    </header>
  )
}
