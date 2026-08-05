// Creator and platform types for Canecsu

export type CreatorCategory = 
  | 'photographer' 
  | 'influencer' 
  | 'videographer' 
  | 'model' 
  | 'artist'
  | 'makeup-artist' 
  | 'video-editor'
  | 'agency'
  | 'graphic-designer'
  | 'singer'
  | 'dj'
  | 'music-band';

export const ARTIST_SUBCATEGORIES = [
  { value: 'painter', label: 'Painter' },
  { value: 'sculpture-artist', label: 'Sculpture Artist' },
  { value: 'mixed-media-artist', label: 'Mixed Media Artist' },
] as const;

export type ProfileType = 'creator' | 'client';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type PriceType = 'fixed' | 'hourly' | 'package' | 'negotiable';

export interface Creator {
  id: string;
  name: string;
  bio?: string;
  avatarUrl: string;
  coverUrl?: string;
  city: string;
  state?: string;
  country: string;
  category: CreatorCategory;
  specializations: string[];
  languages: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  responseRate: number;
  avgResponseTime: string;
  rankScore: number;
  cityRank: number;
  isVerified: boolean;
  isOnline?: boolean;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  priceType: PriceType;
  price: number;
  duration?: string;
  isActive: boolean;
}

export interface PortfolioItem {
  id: string;
  creatorId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  category?: string;
  tags: string[];
  order: number;
  isFeatured: boolean;
}

export interface ProjectBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'grid';
  content: string | string[];
}

export interface Project {
  id: string;
  creator_id: string;
  title: string;
  content_blocks: ProjectBlock[];
  cover_image_url?: string;
  published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    name: string;
    avatar_url: string;
  };
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url: string;
  };
}

export interface Review {
  id: string;
  bookingId: string;
  creatorId: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  rating: number;
  reviewText: string;
  photos?: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  creatorId: string;
  clientId: string;
  serviceId: string;
  status: BookingStatus;
  bookingDate: string;
  bookingTime: string;
  requirements?: string;
  notes?: string;
  totalPrice: number;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<CreatorCategory, string> = {
  'photographer': 'Photographer',
  'influencer': 'Influencer',
  'videographer': 'Videographer',
  'model': 'Model',
  'artist': 'Artist',
  'makeup-artist': 'Makeup Artist',
  'video-editor': 'Video Editor',
  'agency': 'Agency',
  'graphic-designer': 'Graphic Designer',
  'singer': 'Singer',
  'dj': 'DJ',
  'music-band': 'Music Band',
};

export const CATEGORY_ICONS: Record<CreatorCategory, string> = {
  'photographer': '📸',
  'influencer': '✨',
  'videographer': '🎬',
  'model': '💃',
  'artist': '🎨',
  'makeup-artist': '💄',
  'video-editor': '👗',
  'agency': '🏢',
  'graphic-designer': '🖌️',
  'singer': '🎤',
  'dj': '🎧',
  'music-band': '🎸',
};
