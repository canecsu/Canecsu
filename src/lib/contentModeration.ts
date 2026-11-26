export type ModerationField =
  | "bio"
  | "name"
  | "specializations"
  | "service"
  | "comment"
  | "message";

const normalizeModerationText = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasPhoneNumber = (text: string) => {
  // Match common Indian/mobile formats without treating ordinary years
  // such as 2015 or 2015-2024 as contact information.
  const contiguousPhone = /(?:\+?91[\s.-]?)?[6-9]\d{9}\b/.test(text);
  const formattedPhone =
    /(?:\+?\d{1,3}[\s.-]?)?\(?[6-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/.test(text);
  const spacedPhone = /\b(?:[6-9][\s.-]?){10}\b/.test(text);

  return contiguousPhone || formattedPhone || spacedPhone;
};

export const checkContentViolations = (
  text: string,
  field: ModerationField = "bio",
) => {
  const normalized = normalizeModerationText(text);
  if (!normalized) return null;

  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(normalized)) {
    return "Email addresses";
  }

  if (
    /(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-zA-Z0-9-]+\.)+(?:com|in|net|org|co)\b)/i.test(
      normalized,
    )
  ) {
    return "External website links";
  }

  if (hasPhoneNumber(normalized)) {
    return "Phone numbers";
  }

  // Names should not be blocked by normal words such as "profile" or
  // "instagram"; public descriptions/comments still get social checks.
  if (field !== "name") {
    const hasSocialHandle =
      /(?:^|[\s([{])@[a-z0-9][a-z0-9_.-]{1,30}\b/i.test(normalized);
    const hasLabeledSocialId =
      /\b(?:instagram|insta|ig|facebook|fb|twitter|discord|telegram|snapchat|whatsapp|youtube|linkedin)\s+(?:id|handle|username|account|profile)\s*(?:is|:|=)\s*@?[a-z0-9][a-z0-9_.-]{1,30}\b/i.test(
        normalized,
      );

    if (hasSocialHandle || hasLabeledSocialId) {
      return "Social media usernames";
    }

    if (/(?:wa\.me|t\.me|linktr\.ee)\/[a-zA-Z0-9_.-]+/i.test(normalized)) {
      return "Direct chat links";
    }

    if (
      /(?:dm|direct message|message|msg|contact)\s+(?:me|us)\s+(?:on|at|via)\b/i.test(
        normalized,
      )
    ) {
      return "Direct messaging requests";
    }

    if (
      /\b(?:porn|pornography|nude|nudity|naked|xxx|escort(?:s)?|onlyfans|sex\s*work)\b/i.test(
        normalized,
      )
    ) {
      return "Sexual content";
    }
  }

  return null;
};

export const moderationDescription = (
  violation: string,
  field: ModerationField,
) => {
  const subject =
    field === "service"
      ? "service details"
      : field === "specializations"
        ? "specializations"
        : field;

  if (violation === "Sexual content") {
    return `Your ${subject} contains sexual content, which is not allowed.`;
  }

  if (violation === "Social media usernames") {
    return `Please remove social media IDs or usernames from your ${subject}.`;
  }

  if (
    violation === "Direct messaging requests" ||
    violation === "Direct chat links"
  ) {
    return `Please keep direct contact requests and chat links out of your ${subject}.`;
  }

  if (violation === "External website links") {
    return `Please remove external website links from your ${subject}.`;
  }

  return `Please remove direct contact information from your ${subject}.`;
};
