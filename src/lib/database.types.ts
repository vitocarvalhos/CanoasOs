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
        Row: { content: string; created_at: string; id: string; lead_id: string; type: Database["public"]["Enums"]["activity_type"]; user_id: string };
        Insert: { content: string; created_at?: string; id?: string; lead_id: string; type?: Database["public"]["Enums"]["activity_type"]; user_id: string };
        Update: { content?: string; created_at?: string; id?: string; lead_id?: string; type?: Database["public"]["Enums"]["activity_type"]; user_id?: string };
        Relationships: [{ foreignKeyName: "activities_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] }];
      };
      leads: {
        Row: { company: string | null; created_at: string; decision_maker: boolean | null; id: string; loss_reason: string | null; name: string; niche: string | null; notes: string | null; objection: string | null; potential_value: number; problem: string | null; service_interest: string | null; source: string | null; stage: Database["public"]["Enums"]["lead_stage"]; temperature: Database["public"]["Enums"]["lead_temperature"]; timing: string | null; updated_at: string; user_id: string; whatsapp: string | null };
        Insert: { company?: string | null; created_at?: string; decision_maker?: boolean | null; id?: string; loss_reason?: string | null; name: string; niche?: string | null; notes?: string | null; objection?: string | null; potential_value?: number; problem?: string | null; service_interest?: string | null; source?: string | null; stage?: Database["public"]["Enums"]["lead_stage"]; temperature?: Database["public"]["Enums"]["lead_temperature"]; timing?: string | null; updated_at?: string; user_id: string; whatsapp?: string | null };
        Update: { company?: string | null; created_at?: string; decision_maker?: boolean | null; id?: string; loss_reason?: string | null; name?: string; niche?: string | null; notes?: string | null; objection?: string | null; potential_value?: number; problem?: string | null; service_interest?: string | null; source?: string | null; stage?: Database["public"]["Enums"]["lead_stage"]; temperature?: Database["public"]["Enums"]["lead_temperature"]; timing?: string | null; updated_at?: string; user_id?: string; whatsapp?: string | null };
        Relationships: [];
      };
      profiles: {
        Row: { created_at: string; full_name: string | null; id: string };
        Insert: { created_at?: string; full_name?: string | null; id: string };
        Update: { created_at?: string; full_name?: string | null; id?: string };
        Relationships: [];
      };
      tasks: {
        Row: { completed_at: string | null; created_at: string; due_at: string; id: string; lead_id: string; title: string; user_id: string };
        Insert: { completed_at?: string | null; created_at?: string; due_at: string; id?: string; lead_id: string; title: string; user_id: string };
        Update: { completed_at?: string | null; created_at?: string; due_at?: string; id?: string; lead_id?: string; title?: string; user_id?: string };
        Relationships: [{ foreignKeyName: "tasks_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] }];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      activity_type: "note" | "whatsapp" | "call" | "email" | "meeting" | "proposal" | "stage_change" | "task_completed";
      lead_stage: "new" | "contact_attempt" | "conversation" | "qualified" | "meeting_scheduled" | "meeting_done" | "proposal" | "decision" | "follow_up" | "won" | "lost" | "nurture";
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
