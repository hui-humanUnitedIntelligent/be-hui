// src/hooks/useImpact.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { ImpactService, MembershipService } from '../services/db';

export function useImpact() {
  const [projects, setProjects] = useState([]);
  const [round,    setRound]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    (async () => {
      const [projRes, roundRes] = await Promise.all([
        ImpactService.getActiveProjects(),
        ImpactService.getCurrentRound(),
      ]);
      if (!mounted.current) return;
      setProjects(projRes.data || []);
      setRound(roundRes.data || null);
      setError(projRes.error?.message || null);
      setLoading(false);
    })();

    return () => { mounted.current = false; };
  }, []);

  return { projects, round, loading, error };
}

export function useImpactVote(userId) {
  const [votes,      setVotes]      = useState([]);
  const [voteWeight, setVoteWeight] = useState(1);
  const [casting,    setCasting]    = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!userId) return;

    // Pure async IIFE — no .then()
    (async () => {
      const { data } = await MembershipService.getForUser(userId);
      if (!mounted.current) return;
      setVoteWeight(MembershipService.getVoteWeight(data));
    })();

    return () => { mounted.current = false; };
  }, [userId]);

  const loadVotes = useCallback(async (roundId) => {
    if (!userId || !roundId) return;
    const { data } = await ImpactService.getUserVotesThisRound(userId, roundId);
    setVotes(data || []);
  }, [userId]);

  const castVote = useCallback(async (projectId, roundId) => {
    if (!userId) return { error: { message: 'Nicht eingeloggt' } };
    setCasting(true);
    const result = await ImpactService.castVote(userId, projectId, roundId, voteWeight);
    if (result.data) setVotes(prev => [...prev, result.data]);
    setCasting(false);
    return result;
  }, [userId, voteWeight]);

  const maxVotes  = voteWeight >= 2 ? 2 : 1;
  const votesUsed = votes.length;
  const canVote   = votesUsed < maxVotes;

  return { votes, voteWeight, maxVotes, votesUsed, canVote, casting, loadVotes, castVote };
}
