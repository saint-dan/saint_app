-- Run this in the Supabase SQL Editor to create the table

CREATE TABLE public.contractors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    trade_specialty text NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (so the public registration form works)
CREATE POLICY "Allow public inserts" ON public.contractors FOR INSERT TO public WITH CHECK (true);