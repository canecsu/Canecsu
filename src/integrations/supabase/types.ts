export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      availability_slots: {
        Row: {
          booking_id: string | null
          created_at: string
          creator_id: string
          end_time: string
          id: string
          is_available: boolean
          slot_date: string
          start_time: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          creator_id: string
          end_time: string
          id?: string
          is_available?: boolean
          slot_date: string
          start_time: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          creator_id?: string
          end_time?: string
          id?: string
          is_available?: boolean
          slot_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean
          read_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          read_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          read_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          advance_amount: number
          advance_paid_at: string | null
          advance_payment_id: string | null
          approved_at: string | null
          booking_date: string
          booking_time: string | null
          client_id: string
          created_at: string
          creator_id: string
          final_amount: number
          final_paid_at: string | null
          final_payment_id: string | null
          id: string
          location: string | null
          notes: string | null
          platform_fee: number
          rejected_at: string | null
          rejection_reason: string | null
          requirements: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
          work_completed_at: string | null
        }
        Insert: {
          advance_amount?: number
          advance_paid_at?: string | null
          advance_payment_id?: string | null
          approved_at?: string | null
          booking_date: string
          booking_time?: string | null
          client_id: string
          created_at?: string
          creator_id: string
          final_amount?: number
          final_paid_at?: string | null
          final_payment_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          platform_fee?: number
          rejected_at?: string | null
          rejection_reason?: string | null
          requirements?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
          work_completed_at?: string | null
        }
        Update: {
          advance_amount?: number
          advance_paid_at?: string | null
          advance_payment_id?: string | null
          approved_at?: string | null
          booking_date?: string
          booking_time?: string | null
          client_id?: string
          created_at?: string
          creator_id?: string
          final_amount?: number
          final_paid_at?: string | null
          final_payment_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          platform_fee?: number
          rejected_at?: string | null
          rejection_reason?: string | null
          requirements?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
          work_completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      breach_notifications: {
        Row: {
          affected_user_ids: string[]
          created_at: string
          created_by: string | null
          id: string
          is_broadcast: boolean
          message: string
          severity: string
          title: string
        }
        Insert: {
          affected_user_ids?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          is_broadcast?: boolean
          message: string
          severity?: string
          title: string
        }
        Update: {
          affected_user_ids?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          is_broadcast?: boolean
          message?: string
          severity?: string
          title?: string
        }
        Relationships: []
      }
      collab_applications: {
        Row: {
          applicant_id: string
          created_at: string
          id: string
          message: string | null
          project_id: string
          proposed_price: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: string
          message?: string | null
          project_id: string
          proposed_price?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: string
          message?: string | null
          project_id?: string
          proposed_price?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_projects: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: string | null
          created_at: string
          creator_id: string
          deadline: string | null
          description: string
          id: string
          location: string | null
          skills_needed: string[] | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          created_at?: string
          creator_id: string
          deadline?: string | null
          description: string
          id?: string
          location?: string | null
          skills_needed?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          created_at?: string
          creator_id?: string
          deadline?: string | null
          description?: string
          id?: string
          location?: string | null
          skills_needed?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_projects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          available_until: string | null
          avg_response_time: string | null
          category: Database["public"]["Enums"]["creator_category"]
          city_rank: number | null
          completed_bookings: number | null
          created_at: string
          experience_years: number | null
          id: string
          instagram: string | null
          is_available_now: boolean | null
          is_sponsored: boolean | null
          languages: string[] | null
          portfolio_quality_score: number | null
          price_currency: string | null
          price_max: number | null
          price_min: number | null
          profile_id: string
          rank_score: number | null
          response_rate: number | null
          specializations: string[] | null
          sponsored_until: string | null
          subcategory: string | null
          subscription_tier: string | null
          total_bookings: number | null
          twitter: string | null
          updated_at: string
          youtube: string | null
        }
        Insert: {
          available_until?: string | null
          avg_response_time?: string | null
          category?: Database["public"]["Enums"]["creator_category"]
          city_rank?: number | null
          completed_bookings?: number | null
          created_at?: string
          experience_years?: number | null
          id?: string
          instagram?: string | null
          is_available_now?: boolean | null
          is_sponsored?: boolean | null
          languages?: string[] | null
          portfolio_quality_score?: number | null
          price_currency?: string | null
          price_max?: number | null
          price_min?: number | null
          profile_id: string
          rank_score?: number | null
          response_rate?: number | null
          specializations?: string[] | null
          sponsored_until?: string | null
          subcategory?: string | null
          subscription_tier?: string | null
          total_bookings?: number | null
          twitter?: string | null
          updated_at?: string
          youtube?: string | null
        }
        Update: {
          available_until?: string | null
          avg_response_time?: string | null
          category?: Database["public"]["Enums"]["creator_category"]
          city_rank?: number | null
          completed_bookings?: number | null
          created_at?: string
          experience_years?: number | null
          id?: string
          instagram?: string | null
          is_available_now?: boolean | null
          is_sponsored?: boolean | null
          languages?: string[] | null
          portfolio_quality_score?: number | null
          price_currency?: string | null
          price_max?: number | null
          price_min?: number | null
          profile_id?: string
          rank_score?: number | null
          response_rate?: number | null
          specializations?: string[] | null
          sponsored_until?: string | null
          subcategory?: string | null
          subscription_tier?: string | null
          total_bookings?: number | null
          twitter?: string | null
          updated_at?: string
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_payments: {
        Row: {
          amount: number
          booking_id: string
          client_id: string
          created_at: string
          creator_id: string
          id: string
          platform_fee: number | null
          released_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          client_id: string
          created_at?: string
          creator_id: string
          id?: string
          platform_fee?: number | null
          released_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          client_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          platform_fee?: number | null
          released_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_payments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          client_id: string
          created_at: string
          creator_id: string
          id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          stage: string
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          client_id: string
          created_at?: string
          creator_id: string
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          stage: string
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          client_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          stage?: string
          status?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          category: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_featured: boolean
          sort_order: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          type: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_featured?: boolean
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          type?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_violations: {
        Row: {
          context: string | null
          created_at: string
          detected_content: string | null
          id: string
          user_id: string
          violation_type: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          detected_content?: string | null
          id?: string
          user_id: string
          violation_type: string
        }
        Update: {
          context?: string | null
          created_at?: string
          detected_content?: string | null
          id?: string
          user_id?: string
          violation_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          consent_at: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          dob: string | null
          guardian_email: string | null
          id: string
          is_minor: boolean
          is_suspended: boolean
          is_verified: boolean
          marketing_opt_in: boolean
          name: string
          phone: string | null
          state: string | null
          type: Database["public"]["Enums"]["profile_type"]
          updated_at: string
          verification_date: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          consent_at?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          dob?: string | null
          guardian_email?: string | null
          id: string
          is_minor?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          marketing_opt_in?: boolean
          name: string
          phone?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
          verification_date?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          consent_at?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          dob?: string | null
          guardian_email?: string | null
          id?: string
          is_minor?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          marketing_opt_in?: boolean
          name?: string
          phone?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
          verification_date?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_id: string | null
          portfolio_item_id: string | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          portfolio_item_id?: string | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          portfolio_item_id?: string | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_portfolio_item_id_fkey"
            columns: ["portfolio_item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_likes: {
        Row: {
          created_at: string
          id: string
          portfolio_item_id: string | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          portfolio_item_id?: string | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          portfolio_item_id?: string | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_likes_portfolio_item_id_fkey"
            columns: ["portfolio_item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          content_blocks: Json | null
          cover_image_url: string | null
          created_at: string | null
          creator_id: string
          id: string
          published: boolean | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          content_blocks?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          published?: boolean | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          content_blocks?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          published?: boolean | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_days: number | null
          reward_type: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_days?: number | null
          reward_type?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_days?: number | null
          reward_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          client_avatar: string | null
          client_id: string
          client_name: string
          created_at: string
          creator_id: string
          id: string
          is_verified: boolean
          photos: string[] | null
          rating: number
          review_text: string
        }
        Insert: {
          booking_id?: string | null
          client_avatar?: string | null
          client_id: string
          client_name: string
          created_at?: string
          creator_id: string
          id?: string
          is_verified?: boolean
          photos?: string[] | null
          rating: number
          review_text: string
        }
        Update: {
          booking_id?: string | null
          client_avatar?: string | null
          client_id?: string
          client_name?: string
          created_at?: string
          creator_id?: string
          id?: string
          is_verified?: boolean
          photos?: string[] | null
          rating?: number
          review_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          add_ons: Json | null
          created_at: string
          creator_id: string
          deliverables: string[] | null
          description: string | null
          duration: string | null
          id: string
          is_active: boolean
          price: number
          price_type: Database["public"]["Enums"]["price_type"]
          title: string
          updated_at: string
        }
        Insert: {
          add_ons?: Json | null
          created_at?: string
          creator_id: string
          deliverables?: string[] | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean
          price?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          title: string
          updated_at?: string
        }
        Update: {
          add_ons?: Json | null
          created_at?: string
          creator_id?: string
          deliverables?: string[] | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean
          price?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlists: {
        Row: {
          client_id: string
          created_at: string
          creator_id: string
          id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          creator_id: string
          id?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          creator_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string | null
          expires_at: string | null
          id: string
          payment_id: string | null
          plan_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          business_proof_url: string | null
          created_at: string
          gov_id_url: string | null
          id: string
          portfolio_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          business_proof_url?: string | null
          created_at?: string
          gov_id_url?: string | null
          id?: string
          portfolio_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          business_proof_url?: string | null
          created_at?: string
          gov_id_url?: string | null
          id?: string
          portfolio_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      complete_referral: {
        Args: {
          p_referral_code: string
        }
        Returns: {
          success: boolean
          result_status: string
          reward_days: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "accepted"
        | "in_progress"
        | "requested"
        | "approved"
        | "rejected"
        | "advance_pending"
        | "advance_paid"
        | "work_in_progress"
        | "work_completed"
        | "final_pending"
      creator_category:
        | "photographer"
        | "influencer"
        | "videographer"
        | "model"
        | "content-creator"
        | "makeup-artist"
        | "stylist"
        | "Agency"
        | "agency"
        | "graphic-designer"
        | "artist"
        | "singer"
        | "dj"
        | "music-band"
        | "video-editor"
      price_type: "fixed" | "hourly" | "package" | "negotiable"
      profile_type: "creator" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "accepted",
        "in_progress",
        "requested",
        "approved",
        "rejected",
        "advance_pending",
        "advance_paid",
        "work_in_progress",
        "work_completed",
        "final_pending",
      ],
      creator_category: [
        "photographer",
        "influencer",
        "videographer",
        "model",
        "content-creator",
        "makeup-artist",
        "stylist",
        "Agency",
        "agency",
        "graphic-designer",
        "artist",
        "singer",
        "dj",
        "music-band",
        "video-editor",
      ],
      price_type: ["fixed", "hourly", "package", "negotiable"],
      profile_type: ["creator", "client"],
    },
  },
} as const
