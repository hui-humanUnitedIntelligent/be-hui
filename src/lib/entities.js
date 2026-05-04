// Unified entities interface — delegates to supabaseClient which uses the backend proxy
import { HuiWirkerDB, HuiPaymentDB, HuiImpactProjectDB, HuiMessageDB } from "./supabaseClient";

export const HuiWirker = HuiWirkerDB;
export const HuiPayment = HuiPaymentDB;
export const HuiMessage = HuiMessageDB;
export const HuiImpactProject = HuiImpactProjectDB;