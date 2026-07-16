import React from "react";

export const DiscoverPage  = React.lazy(() => import("../../DiscoverPage.jsx"));
export const ImpactPage    = React.lazy(() => import("../../ImpactPage.jsx"));
export const FavoritesPage = React.lazy(() => import("../../FavoritesPage.jsx"));
export const TeilenFlow     = React.lazy(() => import("../../../components/teilen/TeilenFlow.jsx"));
export const WorkFlow       = React.lazy(() => import("../../../system/flows/work/WorkFlow.jsx"));
export const ExperienceFlow = React.lazy(() => import("../../../system/flows/experience/ExperienceFlow.jsx"));
export const ImpactFlow     = React.lazy(() => import("../../../system/flows/impact/ImpactFlow.jsx"));
export const LiveMapPage         = React.lazy(() => import("../../LiveMapPage.jsx"));
export const HuiMatchOverlay     = React.lazy(() => import("../../../components/HuiMatchOverlay.jsx"));
export const HuiMembershipFlow   = React.lazy(() => import("../../../components/HuiMembershipFlow.jsx"));
export const CreatorDashboard    = React.lazy(() => import("../../CreatorDashboard.jsx"));
export const HuiCreateFlow       = React.lazy(() => import("../../../components/HuiCreateFlow.jsx"));
export const StoryComposer       = React.lazy(() => import("../../../components/StoryComposer.jsx"));
