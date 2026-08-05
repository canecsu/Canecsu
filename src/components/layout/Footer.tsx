import { Link, useNavigate } from "react-router-dom";
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Linkedin, 
  Mail, 
  MapPin, 
  ArrowRight, 
  Sparkles,
  Facebook,
  AtSign
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerLinks = {
  discover: [
    { label: "Find Creators", href: "/search" },
    { label: "Categories", href: "/categories" },
    { label: "Rankings", href: "/rankings" },
    { label: "Explore Map", href: "/map" },
  ],
  creators: [
    { label: "Join as Creator", href: "/register/creator" },
    { label: "Creator Dashboard", href: "/dashboard" },
    { label: "Collab Hub", href: "/collab" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Blog", href: "/blog" },
    { label: "Invite & Earn", href: "/referrals" },
  ],
  support: [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Secure Escrow", href: "/escrow" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

const socialLinks = [
  { icon: Instagram, href: "https://www.instagram.com/canecsu_india/", label: "Instagram" },
  { icon: Youtube, href: "https://www.youtube.com/@Canecsu", label: "YouTube" },
  { icon: Linkedin, href: "https://linkedin.com/company/canecsu", label: "LinkedIn" },
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61576488354856", label: "Facebook" },
  { icon: AtSign, href: "https://www.threads.net/@canecsu_india", label: "Threads" },
  // Added X (Twitter)
  { icon: Twitter, href: "https://x.com/canecsu_india", label: "X" },
];

export function Footer() {
  const navigate = useNavigate();

  // Custom function to handle navigation with a smooth scroll-to-top effect
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Smooth scroll to top instantly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Slight delay before navigating to give a "page lifting up" feeling
    setTimeout(() => {
      navigate(href);
    }, 150);
  };

  return (
    <footer className="relative bg-zinc-950 text-zinc-50 overflow-hidden pt-12">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      {/* Newsletter Section */}
      <div className="relative z-10 container mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 md:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
        >
          <div className="max-w-md text-center md:text-left">
            <h3 className="font-heading text-3xl font-bold flex items-center justify-center md:justify-start gap-2 mb-3">
              <Sparkles className="h-6 w-6 text-primary" /> Stay in the loop
            </h3>
            <p className="text-zinc-400">
              Get the latest creator trends, early access to new features, and platform updates directly in your inbox.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 w-full sm:w-72 h-12 rounded-xl focus-visible:ring-primary/50"
            />
            <Button className="h-12 px-8 rounded-xl gradient-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              Subscribe
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Main Footer Links */}
      <div className="relative z-10 container pb-12">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-12">
          
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4">
            <Link to="/" onClick={(e) => handleNavigation(e, '/')} className="flex items-center gap-2 mb-6 group inline-flex">
              <span className="font-heading text-2xl font-bold tracking-tight">
                Canecsu
              </span>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">
              Connecting brilliant creative talent with world-class opportunities. The ultimate platform for discovering, booking, and collaborating with top creators.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-4 text-sm text-zinc-400">
              <a href="mailto:hello@canecsu.com" className="flex items-center gap-3 hover:text-primary transition-colors w-fit">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800"><Mail className="h-4 w-4" /></div>
                info@canecsu.com
              </a>
              <a href="mailto:privacy@canecsu.com" className="flex items-center gap-3 hover:text-primary transition-colors w-fit">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800"><Mail className="h-4 w-4" /></div>
                privacy@canecsu.com <span className="text-xs text-zinc-500">(DPO)</span>
              </a>
              <div className="flex items-center gap-3 w-fit">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800"><MapPin className="h-4 w-4" /></div>
                Patna, Bihar, India
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-heading font-semibold text-lg mb-6 text-zinc-100">Discover</h4>
            <ul className="space-y-3">
              {footerLinks.discover.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavigation(e, link.href)}
                    className="group flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 mr-2 transition-all duration-300 text-primary" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="font-heading font-semibold text-lg mb-6 text-zinc-100">For Creators</h4>
            <ul className="space-y-3">
              {footerLinks.creators.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavigation(e, link.href)}
                    className="group flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 mr-2 transition-all duration-300 text-primary" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="font-heading font-semibold text-lg mb-6 text-zinc-100">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavigation(e, link.href)}
                    className="group flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 mr-2 transition-all duration-300 text-primary" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="font-heading font-semibold text-lg mb-6 text-zinc-100">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavigation(e, link.href)}
                    className="group flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 mr-2 transition-all duration-300 text-primary" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Canecsu. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-primary/20 hover:border-primary/50 transition-all duration-300 hover:scale-110"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
