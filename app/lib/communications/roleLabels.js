/**
 * User-facing role labels for the Communication Platform.
 * Database values: usa_client | end_client | admin
 */

export const REGISTRATION_ROLES = [
  {
    value: "usa_client",
    label: "Brand Owner",
    description: "Assign creatives, start conversations, and track review progress with your servicing team.",
  },
  {
    value: "end_client",
    label: "Servicing Team",
    description: "Receive creatives, review them inline, and collaborate with brand owners.",
  },
];

export const ROLE_LABELS = {
  admin: "Administrator",
  usa_client: "Brand Owner",
  end_client: "Servicing Team",
};

export const ROLE_SHORT_LABELS = {
  admin: "Admin",
  usa_client: "Brand Owner",
  end_client: "Servicing Team",
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || "User";
}

export function isBrandOwner(role) {
  return role === "usa_client" || role === "admin";
}

export function isServicingTeam(role) {
  return role === "end_client";
}

export function getCommunicationPageCopy(role) {
  if (isBrandOwner(role)) {
    return {
      title: "Communication Platform",
      subtitle: "Assign creatives to your Servicing Team, chat in real time, and track review activity.",
      emptyTitle: "No conversations yet",
      emptyHint: "Start a conversation and assign creatives to your Servicing Team.",
      newConversationHint: "Assign creatives to Servicing Team",
      participantLabel: "Servicing Team",
    };
  }

  if (isServicingTeam(role)) {
    return {
      title: "Communication Platform",
      subtitle: "Review creatives from Brand Owners, respond in chat, and submit approvals or revision requests.",
      emptyTitle: "No assignments yet",
      emptyHint: "When a Brand Owner assigns creatives to you, conversations will appear here.",
      newConversationHint: "",
      participantLabel: "Brand Owner",
    };
  }

  return {
    title: "Communication Platform",
    subtitle: "Collaborate on creative reviews in real time.",
    emptyTitle: "No conversations yet",
    emptyHint: "Conversations will appear here once created.",
    newConversationHint: "New conversation",
    participantLabel: "Contact",
  };
}

export function getPostAuthRedirect(_role) {
  return "/dashboard";
}
