export function routeContentTypeSelection(type, setters) {
  const {
    setShowContentSelector,
    setShowTeilen,
    setShowExperienceCreator,
    setShowWerkPublisher,
    setShowInvitationFlow,
  } = setters;

  setShowContentSelector(false);
  if (type === "moment") {
    setShowTeilen(true);
  } else if (type === "experience") {
    setShowExperienceCreator(true);
  } else if (type === "work") {
    setShowWerkPublisher(true);
  } else if (type === "invitation") {
    setShowInvitationFlow(true);
  }
}
