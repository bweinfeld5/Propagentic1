// PropAgentic UI Consistency & Styling Checklist

type ChecklistItem = {
  id: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  location: string;
  component?: string;
  suggestion?: string;
};

export const uiChecklist: ChecklistItem[] = [
  {
    id: "role-card-contrast",
    description: "Fix low contrast icon in selected role card (e.g., teal on teal for 'Landlord')",
    status: "done",
    location: "components/landing/newComponents/EnhancedRoleSelector.jsx",
    component: "EnhancedRoleSelector",
    suggestion: "Use text-white or a high-contrast token for icon fill",
  },
  {
    id: "role-card-hover",
    description: "Add hover shadows and consistent border-radius on all role cards",
    status: "done",
    location: "components/landing/newComponents/EnhancedRoleSelector.jsx",
    suggestion: "Add shadow-md, rounded-xl, and hover:bg-slate-100",
  },
  {
    id: "form-padding-consistency",
    description: "Fix inconsistent padding on Maintenance Request form container",
    status: "done",
    location: "components/maintenance/MaintenanceRequestForm.tsx",
    suggestion: "Update to p-6 or p-8 and apply shadow-lg + rounded-xl",
  },
  {
    id: "photo-upload-style",
    description: "Style image upload box to match input fields",
    status: "done",
    location: "components/maintenance/MaintenanceRequestForm.tsx",
    suggestion: "Use bg-white dark:bg-slate-800, border-gray-300, rounded-lg",
  },
  {
    id: "form-button-style",
    description: "Standardize form buttons across all pages",
    status: "done",
    location: "components/ui/Button.tsx",
    suggestion: "Use bg-propagentic-teal text-white px-6 py-2 rounded-full hover:bg-teal-600",
  },
  {
    id: "dashboard-preview-shadow",
    description: "Ensure dashboard previews have consistent shadows and border styling",
    status: "done",
    location: "components/landing/newComponents/DashboardPreview.tsx",
    suggestion: "Add shadow-xl, rounded-xl, border-gray-200",
  },
  {
    id: "toggle-style-update",
    description: "Style Landlord/Tenant toggle to match button and tab conventions",
    status: "done",
    location: "components/landing/newComponents/DashboardPreview.tsx",
    suggestion: "Use rounded-full px-4 py-2 bg-slate-800 text-white",
  },
  {
    id: "badge-token-colors",
    description: "Update 'New' and 'Assigned' badges to use tokenized colors",
    status: "done",
    location: "components/ui/StatusPill.jsx",
    suggestion: "Use bg-propagentic-blue and bg-propagentic-yellow with consistent rounded-full styles",
  },
  {
    id: "ai-badge-style",
    description: "Improve AI badge styling: font weight, border-radius, and size",
    status: "done",
    location: "components/landing/newComponents/DashboardPreview.tsx",
    suggestion: "Apply font-medium, rounded-md, px-2 py-1, shadow-sm",
  },
  {
    id: "text-heading-consistency",
    description: "Ensure consistent text styles for headings and body",
    status: "in-progress",
    location: "global",
    suggestion: "Use text-3xl font-bold for headings, text-base for body",
  },
];

export default uiChecklist; 