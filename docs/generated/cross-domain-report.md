# Cross-Domain Report — ARCH-006

**Generiert:** 2026-06-30T16:18:31.265Z
**Cross-Domain Violations:** 824

## CROSS_DOMAIN_WRITE (719)
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [CREATION] components/HuiCreateFlow.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'works'
- [COMMUNICATION] components/NotificationCenter.jsx: Cross-Domain Write: COMMUNICATION schreibt verbotene Tabelle 'notifications'
- [COMMUNICATION] components/NotificationCenter.jsx: Cross-Domain Write: COMMUNICATION schreibt verbotene Tabelle 'notifications'
- [COMMUNICATION] components/NotificationCenter.jsx: Cross-Domain Write: COMMUNICATION schreibt verbotene Tabelle 'notifications'
- [CREATION] components/StoryBar.jsx: Cross-Domain Write: CREATION schreibt verbotene Tabelle 'messages'

## DOMAIN_IMPORT (87)
- [KERNEL] App.jsx: Domain Import Violation: KERNEL → WORLD (DOMAIN_IMPORT: KERNEL → WORLD nicht in Contract)
- [KERNEL] App.jsx: Domain Import Violation: KERNEL → WORLD (DOMAIN_IMPORT: KERNEL → WORLD nicht in Contract)
- [KERNEL] App.jsx: Domain Import Violation: KERNEL → INTELLIGENCE (DOMAIN_IMPORT: KERNEL → INTELLIGENCE nicht in Contract)
- [KERNEL] App.jsx: Domain Import Violation: KERNEL → IDENTITY (DOMAIN_IMPORT: KERNEL → IDENTITY nicht in Contract)
- [KERNEL] App.jsx: Domain Import Violation: KERNEL → IDENTITY (DOMAIN_IMPORT: KERNEL → IDENTITY nicht in Contract)
- [KERNEL] App.jsx: Domain Import Violation: KERNEL → IDENTITY (DOMAIN_IMPORT: KERNEL → IDENTITY nicht in Contract)
- [KERNEL] App.jsx: Domain Import Violation: KERNEL → IDENTITY (DOMAIN_IMPORT: KERNEL → IDENTITY nicht in Contract)
- [KERNEL] App.jsx: Domain Import Violation: KERNEL → CONNECTION (DOMAIN_IMPORT: KERNEL → CONNECTION nicht in Contract)
- [KERNEL] App.jsx: Domain Import Violation: KERNEL → IMPACT (DOMAIN_IMPORT: KERNEL → IMPACT nicht in Contract)
- [PRESENCE] components/CreatorPresence.jsx: Domain Import Violation: PRESENCE → INTELLIGENCE (DOMAIN_IMPORT: PRESENCE → INTELLIGENCE nicht in Contract)
- [KERNEL] components/EmptyState.jsx: Domain Import Violation: KERNEL → INTELLIGENCE (DOMAIN_IMPORT: KERNEL → INTELLIGENCE nicht in Contract)
- [IDENTITY] components/HuiMembershipFlow.jsx: Domain Import Violation: IDENTITY → WORLD (DOMAIN_IMPORT: IDENTITY → WORLD nicht in Contract)
- [WIRKUNG] components/HuiPlusSheet.jsx: Domain Import Violation: WIRKUNG → WORLD (DOMAIN_IMPORT: WIRKUNG → WORLD nicht in Contract)
- [WIRKUNG] components/HuiPlusSheet.jsx: Domain Import Violation: WIRKUNG → IDENTITY (import-forbidden: WIRKUNG → IDENTITY)
- [WIRKUNG] components/OrbCompass.jsx: Domain Import Violation: WIRKUNG → CREATION (import-forbidden: WIRKUNG → CREATION)

## OWNERSHIP_VIOLATION (18)
- [CREATION] components/HuiCreateFlow.jsx: Ownership Violation: 'stories' hat 5 Writer, Owner ist CREATION
- [CREATION] components/HuiCreateFlow.jsx: Ownership Violation: 'works' hat 9 Writer, Owner ist CREATION
- [COMMUNICATION] components/NotificationCenter.jsx: Ownership Violation: 'notifications' hat 11 Writer, Owner ist COMMUNICATION
- [CREATION] components/StoryBar.jsx: Ownership Violation: 'story_views' hat 3 Writer, Owner ist CREATION
- [COMMUNICATION] components/StoryBar.jsx: Ownership Violation: 'messages' hat 4 Writer, Owner ist COMMUNICATION
- [IMPACT] components/SupportSheet.jsx: Ownership Violation: 'impact_projects' hat 1 Writer, Owner ist IMPACT
- [IDENTITY] components/TalentOnboarding.jsx: Ownership Violation: 'profiles' hat 17 Writer, Owner ist IDENTITY
- [CREATION] components/experiences/ExperienceWizard.jsx: Ownership Violation: 'experiences' hat 3 Writer, Owner ist CREATION
- [IMPACT] components/studio/ImpactStimmenModal.jsx: Ownership Violation: 'impact_votes' hat 3 Writer, Owner ist IMPACT
- [IDENTITY] components/studio/ProfilBearbeitenModal.jsx: Ownership Violation: 'wirker_profiles' hat 3 Writer, Owner ist IDENTITY
- [CONNECTION] core/HuiConnectionEngine.jsx: Ownership Violation: 'follows' hat 2 Writer, Owner ist CONNECTION
- [COMMUNICATION] lib/bookingContext.js: Ownership Violation: 'chats' hat 2 Writer, Owner ist COMMUNICATION
- [COMMERCE] lib/bookingContext.js: Ownership Violation: 'bookings' hat 2 Writer, Owner ist COMMERCE
- [CONNECTION] lib/trustContext.js: Ownership Violation: 'recommendations' hat 2 Writer, Owner ist CONNECTION
- [CREATION] services/content.js: Ownership Violation: 'feed_posts' hat 1 Writer, Owner ist CREATION
