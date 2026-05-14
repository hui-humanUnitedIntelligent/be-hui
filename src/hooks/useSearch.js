// src/hooks/useSearch.js
import { useState, useCallback, useRef } from 'react';
import { SearchService } from '../services/db';
import { debounce } from '../lib/perfUtils';

export function useSearch() {
  const [results, setResults] = useState({ profiles: [], works: [], experiences: [] });
  const [loading, setLoading] = useState(false);
  const [query,   setQuery]   = useState('');

  const debouncedSearch = useRef(
    debounce(async (q) => {
      if (!q || q.length < 2) {
        setResults({ profiles: [], works: [], experiences: [] });
        setLoading(false);
        return;
      }
      const data = await SearchService.search(q);
      setResults(data);
      setLoading(false);
    }, 350)
  ).current;

  const search = useCallback((q) => {
    setQuery(q);
    if (q.length >= 2) setLoading(true);
    debouncedSearch(q);
  }, [debouncedSearch]);

  const clear = useCallback(() => {
    setQuery('');
    setResults({ profiles: [], works: [], experiences: [] });
  }, []);

  const totalCount = results.profiles.length + results.works.length + results.experiences.length;

  return { results, loading, query, search, clear, totalCount };
}
