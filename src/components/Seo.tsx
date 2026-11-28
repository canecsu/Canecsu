import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const siteUrl = "https://www.canecsu.com";

const routeMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "CANECSU – India's Creative Talent Marketplace",
    description: "Discover, hire, and collaborate with photographers, videographers, models, influencers, and creative professionals across India.",
  },
  "/search": {
    title: "Find Creative Professionals | CANECSU",
    description: "Search and compare creative professionals by category, location, services, and availability on CANECSU.",
  },
  "/categories": {
    title: "Creative Categories | CANECSU",
    description: "Explore creative categories and discover professionals for your next project on CANECSU.",
  },
  "/rankings": {
    title: "Creator Rankings | CANECSU",
    description: "Explore creator rankings based on portfolio quality, activity, reviews, bookings, and platform trust signals.",
  },
  "/how-it-works": {
    title: "How CANECSU Works",
    description: "Learn how clients discover creators, send enquiries, book services, and collaborate on CANECSU.",
  },
  "/help": {
    title: "Help Center | CANECSU",
    description: "Find answers about accounts, creator profiles, verification, bookings, payments, safety, and support on CANECSU.",
  },
  "/verification-terms": {
    title: "Creator Verification Terms | CANECSU",
    description: "Read the review process, eligibility, benefits, renewal, and limitations for CANECSU's creator verification badge.",
  },
  "/about": {
    title: "About CANECSU",
    description: "Learn about CANECSU, a marketplace connecting India's creative professionals with clients and brands.",
  },
  "/contact": {
    title: "Contact CANECSU",
    description: "Contact the CANECSU support team for account, creator, booking, payment, or safety assistance.",
  },
};

const setMeta = (selector: string, attribute: string, value: string) => {
  const element = document.querySelector<HTMLMetaElement>(selector);
  if (element) element.setAttribute(attribute, value);
};

const Seo = () => {
  const location = useLocation();

  useEffect(() => {
    const key = location.pathname === "/" ? "/" : location.pathname.replace(/\/$/, "");
    const meta = routeMeta[key] || {
      title: "CANECSU – India's Creative Talent Marketplace",
      description: "Discover and collaborate with creative professionals across India on CANECSU.",
    };
    const canonicalUrl = `${siteUrl}${location.pathname}`;

    document.title = meta.title;
    setMeta('meta[name="description"]', "content", meta.description);
    setMeta('meta[property="og:title"]', "content", meta.title);
    setMeta('meta[property="og:description"]', "content", meta.description);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);
    setMeta('meta[name="twitter:title"]', "content", meta.title);
    setMeta('meta[name="twitter:description"]', "content", meta.description);

    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    canonical?.setAttribute("href", canonicalUrl);
  }, [location.pathname]);

  return null;
};

export default Seo;
