import { Link } from "react-router";
import { Button } from "./ui/button";
import { ShoppingCart } from "lucide-react";
import tagmeLogo from "../assets/tagme-logo.svg";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img src={tagmeLogo} alt="TagMe Connections" className="h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/shop" className="text-sm font-medium transition-colors hover:text-primary">
            Shop
          </Link>
          <Link to="/services" className="text-sm font-medium transition-colors hover:text-primary">
            Services
          </Link>
          <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary">
            About
          </Link>
          <Link to="/contact" className="text-sm font-medium transition-colors hover:text-primary">
            Contact
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Cart */}
          <Button variant="ghost" size="sm" className="flex items-center space-x-1">
            <ShoppingCart className="h-4 w-4" />
            <span>(0)</span>
          </Button>

          {/* Mobile menu button */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>
      </div>
    </header>
  );
}
