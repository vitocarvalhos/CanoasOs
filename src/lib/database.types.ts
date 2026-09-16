export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      activities: {
        Row: { content: string; created_at: string; event_key: string | null; event_type: string | null; id: string; lead_id: string; metadata: Json; type: Database["public"]["Enums"]["activity_type"]; user_id: string };
        Insert: { content: string; created_at?: string; event_key?: string | null; event_type?: string | null; id?: string; lead_id: string; metadata?: Json; type?: Database["public"]["Enums"]["activity_type"]; user_id: string };
        Update: { content?: string; created_at?: string; event_key?: string | null; event_type?: string | null; id?: string; lead_id?: string; metadata?: Json; type?: Database["public"]["Enums"]["activity_type"]; user_id?: string };
        Relationships: [{ foreignKeyName: "activities_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] }];
      };
      leads: {
        Row: { archive_reason: string | null; archived_at: string | null; company: string | null; created_at: string; decision_maker: boolean | null; id: string; loss_reason: string | null; name: string; niche: string | null; notes: string | null; objection: string | null; potential_value: number; problem: string | null; service_interest: string | null; source: string | null; stage: Database["public"]["Enums"]["lead_stage"]; temperature: Database["public"]["Enums"]["lead_temperature"]; timing: string | null; updated_at: string; user_id: string; whatsapp: string | null };
        Insert: { archive_reason?: string | null; archived_at?: string | null; company?: string | null; created_at?: string; decision_maker?: boolean | null; id?: string; loss_reason?: string | null; name: string; niche?: string | null; notes?: string | null; objection?: string | null; potential_value?: number; problem?: string | null; service_interest?: string | null; source?: string | null; stage?: Database["public"]["Enums"]["lead_stage"]; temperature?: Database["public"]["Enums"]["lead_temperature"]; timing?: string | null; updated_at?: string; user_id: string; whatsapp?: string | null };
        Update: { archive_reason?: string | null; archived_at?: string | null; company?: string | null; created_at?: string; decision_maker?: boolean | null; id?: string; loss_reason?: string | null; name?: string; niche?: string | null; notes?: string | null; objection?: string | null; potential_value?: number; problem?: string | null; service_interest?: string | null; source?: string | null; stage?: Database["public"]["Enums"]["lead_stage"]; temperature?: Database["public"]["Enums"]["lead_temperature"]; timing?: string | null; updated_at?: string; user_id?: string; whatsapp?: string | null };
        Relationships: [];
      };
      profiles: {
        Row: { created_at: string; full_name: string | null; id: string };
        Insert: { created_at?: string; full_name?: string | null; id: string };
        Update: { created_at?: string; full_name?: string | null; id?: string };
        Relationships: [];
      };
      tasks: {
        Row: { action_type_id: string | null; completed_at: string | null; created_at: string; due_at: string; id: string; lead_id: string; rescheduled_from: string | null; title: string; updated_at: string; user_id: string };
        Insert: { action_type_id?: string | null; completed_at?: string | null; created_at?: string; due_at: string; id?: string; lead_id: string; rescheduled_from?: string | null; title: string; updated_at?: string; user_id: string };
        Update: { action_type_id?: string | null; completed_at?: string | null; created_at?: string; due_at?: string; id?: string; lead_id?: string; rescheduled_from?: string | null; title?: string; updated_at?: string; user_id?: string };
        Relationships: [{ foreignKeyName: "tasks_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] }];
      };
      catalog_options: {
        Row: { active: boolean; category: string; created_at: string; id: string; label: string; normalized_value: string | null; updated_at: string; user_id: string };
        Insert: { active?: boolean; category: string; created_at?: string; id?: string; label: string; updated_at?: string; user_id: string };
        Update: { active?: boolean; category?: string; label?: string; updated_at?: string; user_id?: string };
        Relationships: [];
      };
      daily_tips: {
        Row: { active: boolean; category: string; content: string; created_at: string; id: number; position: number };
        Insert: { active?: boolean; category: string; content: string; created_at?: string; id?: number; position: number };
        Update: { active?: boolean; category?: string; content?: string; position?: number };
        Relationships: [];
      };
      user_daily_tips: {
        Row: { assigned_at: string; cycle: number; local_date: string; read_at: string | null; tip_id: number; user_id: string };
        Insert: { assigned_at?: string; cycle?: number; local_date: string; read_at?: string | null; tip_id: number; user_id: string };
        Update: { cycle?: number; local_date?: string; read_at?: string | null; tip_id?: number; user_id?: string };
        Relationships: [{ foreignKeyName: "user_daily_tips_tip_id_fkey"; columns: ["tip_id"]; isOneToOne: false; referencedRelation: "daily_tips"; referencedColumns: ["id"] }];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      activity_type: "note" | "whatsapp" | "call" | "email" | "meeting" | "proposal" | "stage_change" | "task_completed";
      lead_stage: "new" | "contact_attempt" | "conversation" | "qualified" | "meeting_scheduled" | "meeting_no_show" | "meeting_done" | "proposal" | "decision" | "follow_up" | "follow_up_2" | "follow_up_3" | "follow_up_4" | "follow_up_5" | "follow_up_6" | "won" | "lost" | "nurture";
      lead_temperature: "cold" | "warm" | "hot";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type LeadStage = Database["public"]["Enums"]["lead_stage"];
export type LeadTemperature = Database["public"]["Enums"]["lead_temperature"];
