export const ECHO_TOKEN = {
  chainId: "0x2105",
  chainName: "Base",
  address: "0xA7F63eB41779925803a3EEC30890742571e63Ba3",
  decimals: 18,
  symbol: "ECHO",
};

export const BANKR_TOKEN = {
  chainId: "0x2105",
  chainName: "Base",
  address: "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
  decimals: 18,
  symbol: "BNKR",
  displaySymbol: "BANKR",
  name: "BankrCoin",
};

export const DARKSOL_TOKEN = {
  chainId: "0x2105",
  chainName: "Base",
  address: "0x00cb1FBcA324d51325A7264d54072Bc073c28BA3",
  decimals: 18,
  symbol: "DARKSOL",
  displaySymbol: "DARKSOL",
  name: "Darksol",
};

export const MIROSHARK_TOKEN = {
  chainId: "0x2105",
  chainName: "Base",
  address: "0xd7bc6a05a56655fb2052f742b012d1dfd66e1ba3",
  decimals: 18,
  symbol: "MIROSHARK",
  displaySymbol: "MiroShark",
  name: "MiroShark",
};

export const PERK_TOKENS = {
  ECHO: ECHO_TOKEN,
  BNKR: BANKR_TOKEN,
  BANKR: BANKR_TOKEN,
  DARKSOL: DARKSOL_TOKEN,
  MIROSHARK: MIROSHARK_TOKEN,
};

export const PARTNERS = [
  {
    id: "builtbyecho",
    slug: "echo",
    name: "BuiltByEcho",
    shortName: "Echo",
    tokenSymbol: "ECHO",
    tokenAddress: ECHO_TOKEN.address,
    logo: "assets/brand/builtbyecho-logo.png",
    accent: "oklch(0.81 0.17 159)",
    accent2: "oklch(0.78 0.12 212)",
    status: "live",
    tagline: "The home base for holder utility, tool credits, and partner rewards.",
    audience: "ECHO holders",
    requirement: "Hold ECHO on Base",
    emptyCopy: "Connect a wallet holding ECHO to unlock BuiltByEcho holder perks.",
    links: [
      { label: "Website", url: "https://www.builtbyecho.xyz/" },
      { label: "GitHub", url: "https://github.com/BuiltByEcho" },
      { label: "X", url: "https://x.com/BuiltByEcho" },
    ],
  },
  {
    id: "bankr",
    slug: "bankr",
    name: "Bankr",
    shortName: "Bankr",
    tokenSymbol: "BNKR",
    displayTokenSymbol: "BANKR",
    tokenAddress: BANKR_TOKEN.address,
    logo: "assets/brand/bankr-icon.png",
    header: "assets/brand/bankr-header.png",
    accent: "oklch(0.72 0.16 92)",
    accent2: "oklch(0.8 0.12 145)",
    status: "partner-live",
    tagline: "Bankr holders can claim a starter Echo tool credit.",
    audience: "Bankr holders",
    requirement: "Verify Bankr holder status",
    emptyCopy: "Connect a wallet holding BANKR to unlock one starter Echo tool credit.",
    links: [
      { label: "Website", url: "https://bankr.bot" },
      { label: "X", url: "https://x.com/bankrbot" },
    ],
  },
  {
    id: "darksol",
    slug: "darksol",
    name: "Darksol",
    shortName: "Darksol",
    tokenSymbol: "DARKSOL",
    displayTokenSymbol: "DARKSOL",
    tokenAddress: DARKSOL_TOKEN.address,
    logo: "assets/brand/darksol-icon.jpg",
    header: "assets/brand/darksol-banner.png",
    headerFit: "contain",
    accent: "oklch(0.86 0.16 88)",
    accent2: "oklch(0.7 0.12 125)",
    status: "partner-live",
    tagline: "Darksol holders can claim a starter Echo tool credit.",
    audience: "Darksol holders",
    requirement: "Verify DARKSOL holder status",
    emptyCopy: "Connect a wallet holding DARKSOL to unlock one starter Echo tool credit.",
    links: [
      { label: "Website", url: "https://darksol.net/" },
      { label: "GitHub", url: "https://github.com/darks0l" },
      { label: "X", url: "https://x.com/Darks0l_" },
    ],
  },
  {
    id: "miroshark",
    slug: "miroshark",
    name: "MiroShark",
    shortName: "MiroShark",
    tokenSymbol: "MIROSHARK",
    displayTokenSymbol: "MiroShark",
    tokenAddress: MIROSHARK_TOKEN.address,
    logo: "assets/brand/miroshark-icon.jpg",
    header: "assets/brand/miroshark-header.jpg",
    accent: "oklch(0.73 0.15 221)",
    accent2: "oklch(0.78 0.12 174)",
    status: "coming-soon",
    tagline: "MiroShark perks are coming soon while we finalize the holder details.",
    audience: "MiroShark holders",
    requirement: "Coming soon",
    emptyCopy: "MiroShark holder perks are not claimable yet.",
    links: [
      { label: "Website", url: "https://miroshark.xyz/" },
      { label: "GitHub", url: "https://github.com/aaronjmars/MiroShark" },
      { label: "X", url: "https://x.com/miroshark_" },
    ],
  },
];

export const DEFAULT_PERKS = [
  {
    id: "holder-request-pass",
    title: "Holder Request Pass",
    partnerId: "builtbyecho",
    partner: "BuiltByEcho",
    type: "Holder",
    status: "live",
    minEcho: 1,
    tokenRequirement: { token: "ECHO", min: 1 },
    expires: "Always on",
    summary: "Submit one request for a perk, tool, review, or partner reward you want added next.",
    deliverable: "Private intake receipt",
    cta: "Create request",
  },
  {
    id: "orbit-review",
    title: "Build Review Credit",
    partnerId: "builtbyecho",
    partner: "BuiltByEcho",
    type: "Service",
    status: "live",
    minEcho: 1_000_000,
    tokenRequirement: { token: "ECHO", min: 1_000_000 },
    expires: "June sprint",
    summary: "One focused review of a project, repo, landing page, or agent-facing workflow.",
    deliverable: "Action memo",
    cta: "Claim review",
  },
  {
    id: "relay-pack",
    title: "Agent Context Pack",
    partnerId: "builtbyecho",
    partner: "BuiltByEcho",
    type: "Tool Credit",
    status: "live",
    minEcho: 5_000_000,
    tokenRequirement: { token: "ECHO", min: 5_000_000 },
    expires: "30 days",
    summary: "A starter context pack that turns messy project notes into cleaner agent handoff material.",
    deliverable: "Context pack credit",
    cta: "Unlock pack",
  },
  {
    id: "office-hours",
    title: "Priority Build Slot",
    partnerId: "builtbyecho",
    partner: "BuiltByEcho",
    type: "Service",
    status: "live",
    minEcho: 10_000_000,
    tokenRequirement: { token: "ECHO", min: 10_000_000 },
    expires: "Monthly",
    summary: "A limited monthly holder slot for turning a raw idea into a scoped build plan or prototype direction.",
    deliverable: "Build plan",
    cta: "Request slot",
  },
  {
    id: "partner-vault",
    title: "Partner Boost Tier",
    partnerId: "builtbyecho",
    partner: "BuiltByEcho + partners",
    type: "Partner",
    status: "live",
    minEcho: 25_000_000,
    tokenRequirement: { token: "ECHO", min: 25_000_000 },
    expires: "Always on",
    summary: "Register for boosted eligibility when partner perks launch for wallets holding ECHO plus the partner token.",
    deliverable: "Boost eligibility",
    cta: "Register boost",
  },
  {
    id: "bankr-tool-credit",
    title: "Bankr Echo Tool Credit",
    partnerId: "bankr",
    partner: "Bankr",
    type: "Partner credit",
    status: "live",
    minEcho: 0,
    tokenRequirement: { token: "BNKR", min: 1 },
    expires: "Partner launch",
    summary: "Bankr holders can claim one starter Echo tool credit for API Finder, a quick research run, repo brief, or context pack starter.",
    deliverable: "1 Echo tool credit",
    cta: "Claim tool credit",
    featured: true,
  },
  {
    id: "bankr-echo-boost-credit",
    title: "Echo + Bankr Bonus Credit",
    partnerId: "bankr",
    partner: "Bankr + Echo",
    type: "Dual-holder credit",
    status: "live",
    minEcho: 0,
    tokenRequirements: [
      { token: "BNKR", min: 1 },
      { token: "ECHO", min: 1 },
    ],
    expires: "Partner launch",
    summary: "Wallets holding both Bankr and ECHO can claim a second Echo tool credit.",
    deliverable: "Second Echo tool credit",
    cta: "Claim bonus credit",
    featured: true,
  },
  {
    id: "darksol-tool-credit",
    title: "Darksol Echo Tool Credit",
    partnerId: "darksol",
    partner: "Darksol",
    type: "Partner credit",
    status: "live",
    minEcho: 0,
    tokenRequirement: { token: "DARKSOL", min: 1 },
    expires: "Partner launch",
    summary: "Darksol holders can claim one starter Echo tool credit for API Finder, a quick research run, repo brief, or context pack starter.",
    deliverable: "1 Echo tool credit",
    cta: "Claim tool credit",
    featured: true,
  },
  {
    id: "darksol-echo-boost-credit",
    title: "Echo + Darksol Bonus Credit",
    partnerId: "darksol",
    partner: "Darksol + Echo",
    type: "Dual-holder credit",
    status: "live",
    minEcho: 0,
    tokenRequirements: [
      { token: "DARKSOL", min: 1 },
      { token: "ECHO", min: 1 },
    ],
    expires: "Partner launch",
    summary: "Wallets holding both Darksol and ECHO can claim a second Echo tool credit.",
    deliverable: "Second Echo tool credit",
    cta: "Claim bonus credit",
    featured: true,
  },
  {
    id: "miroshark-paid-call",
    title: "MiroShark Run Credit",
    partnerId: "miroshark",
    partner: "MiroShark",
    type: "Partner credit",
    status: "draft",
    minEcho: 0,
    tokenRequirement: { token: "MIROSHARK", min: 1 },
    expires: "Partner launch",
    summary: "MiroShark holder credit details are being finalized.",
    deliverable: "One MiroShark run",
    cta: "Coming soon",
    featured: true,
  },
  {
    id: "miroshark-echo-boost-credit",
    title: "Echo + MiroShark Boost Credit",
    partnerId: "miroshark",
    partner: "MiroShark + Echo",
    type: "Dual-holder credit",
    status: "draft",
    minEcho: 0,
    tokenRequirements: [
      { token: "MIROSHARK", min: 1 },
      { token: "ECHO", min: 1 },
    ],
    expires: "Partner launch",
    summary: "Dual-holder MiroShark credit details are being finalized.",
    deliverable: "Second MiroShark run",
    cta: "Coming soon",
    featured: true,
  },
];

export function normalizeAddress(address) {
  return String(address || "").trim().toLowerCase();
}

export function formatEcho(value) {
  const number = Number(value || 0);
  if (number >= 1_000_000_000) return `${trimNumber(number / 1_000_000_000)}B`;
  if (number >= 1_000_000) return `${trimNumber(number / 1_000_000)}M`;
  if (number >= 1_000) return `${trimNumber(number / 1_000)}K`;
  return trimNumber(number);
}

export function trimNumber(value) {
  return Number(value)
    .toLocaleString(undefined, { maximumFractionDigits: 2 })
    .replace(/\.0+$/, "");
}

export function echoFromRaw(raw, decimals = ECHO_TOKEN.decimals) {
  const amount = BigInt(raw || 0);
  const scale = 10n ** BigInt(decimals);
  const whole = amount / scale;
  const fraction = amount % scale;
  const fractionText = fraction.toString().padStart(decimals, "0").slice(0, 4);
  return Number(`${whole}.${fractionText}`);
}

export function tierForBalance(balance) {
  const amount = Number(balance || 0);
  if (amount >= 100_000_000) {
    return {
      name: "Core",
      next: null,
      progress: 100,
      description: "Top-tier holder access and priority partner perks.",
    };
  }
  if (amount >= 10_000_000) {
    return {
      name: "Builder",
      next: 100_000_000,
      progress: progressBetween(amount, 10_000_000, 100_000_000),
      description: "Builder-room access, tool credits, and office-hour claims.",
    };
  }
  if (amount >= 1_000_000) {
    return {
      name: "Supporter",
      next: 10_000_000,
      progress: progressBetween(amount, 1_000_000, 10_000_000),
      description: "Holder tools, review credits, and early utility claims.",
    };
  }
  if (amount >= 1) {
    return {
      name: "Member",
      next: 1_000_000,
      progress: progressBetween(amount, 1, 1_000_000),
      description: "Basic member access and holder desk eligibility.",
    };
  }
  return {
    name: "Visitor",
    next: 1,
    progress: 0,
    description: "Connect a wallet holding ECHO to unlock member perks.",
  };
}

export function progressBetween(value, floor, target) {
  return Math.max(0, Math.min(100, Math.round(((value - floor) / (target - floor)) * 100)));
}

export function isPerkEligible(perk, balance) {
  return Number(balance || 0) >= Number(perk.minEcho || 0);
}

export function isPartnerPerkEligible(perk, balances = {}) {
  const requirements = tokenRequirementsForPerk(perk);
  if (!requirements.length) return isPerkEligible(perk, balances.ECHO || 0);
  return requirements.every((requirement) => {
    const token = String(requirement.token || "ECHO").toUpperCase();
    return Number(balances[token] || 0) >= Number(requirement.min || 0);
  });
}

export function perkState(perk, balance, claimedIds = [], balances = { ECHO: balance }) {
  if (claimedIds.includes(perk.id)) return "claimed";
  if (perk.status !== "live") return "preview";
  if (!isPartnerPerkEligible(perk, balances)) return "locked";
  return "available";
}

export function summarizePerks(perks, balance, claimedIds = [], balances = { ECHO: balance }) {
  return perks.reduce(
    (summary, perk) => {
      const state = perkState(perk, balance, claimedIds, balances);
      summary[state] += 1;
      return summary;
    },
    { available: 0, claimed: 0, locked: 0, preview: 0 },
  );
}

export function partnerById(partnerId) {
  return PARTNERS.find((partner) => partner.id === partnerId) || PARTNERS[0];
}

export function partnersForPerks(perks = DEFAULT_PERKS) {
  const ids = new Set(perks.map((perk) => perk.partnerId || "builtbyecho"));
  return PARTNERS.filter((partner) => ids.has(partner.id));
}

export function tokenRequirementsForPerk(perk) {
  if (Array.isArray(perk?.tokenRequirements)) return perk.tokenRequirements;
  return perk?.tokenRequirement ? [perk.tokenRequirement] : [];
}

export function makeClaimId(wallet, perkId) {
  return `${normalizeAddress(wallet) || "demo"}:${perkId}`;
}
