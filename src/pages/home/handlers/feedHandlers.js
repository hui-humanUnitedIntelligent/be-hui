import { shareContent } from "../../../lib/shareContent.js";

export function createFeedHandlers({
  navigate,
  openProfileById,
  setCart,
  setShowWerkeKorb,
  handleTab,
  feedRefreshRef,
  scrollContainerRef,
}) {
  return {
    onRefreshBind: (fn) => { feedRefreshRef.current = fn; },
    onProfile: (userId) => {
      if (!userId) return;
      if (window.__HUI_DEBUG_PROFILE__) {
        window.__HUI_DEBUG_PROFILE__(userId);
      }
      openProfileById(userId);
    },
    onBook: (item) => {
      if (!item?.id) return;
      setCart(prev => {
        if (prev.some(x => x.id === item.id)) return prev;
        return [...prev, item];
      });
      setShowWerkeKorb(false);
    },
    onDetail: (item) => {
      const werkId = item?.id || item?._raw?.id;
      if (werkId) navigate(`/work/${werkId}`);
    },
    onShare: (item) => shareContent(item),
    onEventPress: (ev) => {
      const creatorId = ev?.creator_id || ev?.author?.id || ev?.user_id;
      if (creatorId) openProfileById(creatorId);
    },
    onMoreEvents: () => handleTab("discover"),
    onDiscover: () => handleTab("discover"),
    onProjectPress: () => handleTab("impact"),
    scrollContainerRef,
  };
}
