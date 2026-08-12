-- Migration 106: rpc_check_own_blocked_status — Fix für Login-Block-Check
-- Date: 2026-08-12
-- Purpose: Migration 104 (Security Hardening) hat die Spalten "blocked" und
-- "blocked_at" der Tabelle profiles per Column-Level-REVOKE für ALLE Rollen
-- gesperrt (verhindert, dass andere Nutzer sehen wer blockiert ist).
-- Nebenwirkung: LoginPage.jsx konnte den eigenen Blocked-Status beim Login
-- nicht mehr lesen -- das SELECT auf "blocked, blocked_at" schlug mit 403 fehl,
-- wodurch der Block-Check lautlos übersprungen wurde (blockierte Nutzer
-- konnten sich wieder einloggen, da `prof` immer null war).
--
-- Fix: SECURITY DEFINER RPC, die NUR den eigenen Blocked-Status liefert
-- (auth.uid() = Zeile), umgeht damit gezielt den Column-Grant nur für die
-- eigene Zeile -- kein anderer Nutzer kann fremde Blocked-Status abfragen.

CREATE OR REPLACE FUNCTION rpc_check_own_blocked_status()
RETURNS TABLE(blocked boolean, blocked_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.blocked, p.blocked_at
  FROM profiles p
  WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION rpc_check_own_blocked_status() TO authenticated;
