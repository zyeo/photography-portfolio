export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      photos: {
        Row: {
          id: string;
          image_path: string;
          public_image_path: string | null;
          original_filename: string;
          date_taken: string | null;
          location_name: string | null;
          latitude: number | null;
          longitude: number | null;
          camera: string | null;
          lens: string | null;
          aperture: string | null;
          shutter_speed: string | null;
          iso: number | null;
          medium: Database["public"]["Enums"]["photo_medium"];
          hidden_tags: string[];
          hero_approved: boolean;
          pinned_hero: boolean;
          focal_point_x: number;
          focal_point_y: number;
          mobile_crop: Json | null;
          selected: boolean;
          selected_size: Database["public"]["Enums"]["selected_size"] | null;
          selected_order: number | null;
          published: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["photos"]["Row"]> & {
          image_path: string;
          original_filename: string;
        };
        Update: Partial<Database["public"]["Tables"]["photos"]["Row"]>;
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          photo_id: string;
          entry_date: string;
          title: string;
          reflection: string;
          weather: string | null;
          published: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["journal_entries"]["Row"]> & {
          photo_id: string;
          entry_date: string;
          title: string;
          reflection: string;
        };
        Update: Partial<Database["public"]["Tables"]["journal_entries"]["Row"]>;
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          title: string;
          slug: string;
          type: Database["public"]["Enums"]["collection_type"];
          description: string | null;
          cover_photo_id: string | null;
          start_date: string | null;
          end_date: string | null;
          published: boolean;
          display_order: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["collections"]["Row"]> & {
          title: string;
          slug: string;
          type: Database["public"]["Enums"]["collection_type"];
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Row"]>;
        Relationships: [];
      };
      photo_collections: {
        Row: {
          photo_id: string;
          collection_id: string;
          display_order: number | null;
        };
        Insert: Omit<Database["public"]["Tables"]["photo_collections"]["Row"], "display_order"> & {
          display_order?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["photo_collections"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      photo_medium: "digital" | "film";
      selected_size: "normal" | "large";
      collection_type: "medium" | "project" | "theme";
    };
    CompositeTypes: Record<string, never>;
  };
};
