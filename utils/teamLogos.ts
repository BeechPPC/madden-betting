// NFL Team Logo Mapping
// Using ESPN's CDN for consistent, high-quality team logos

export interface TeamLogo {
  name: string;
  logoUrl: string;
  abbreviation: string;
}

export const NFL_TEAMS: TeamLogo[] = [
  { name: "Arizona Cardinals", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png", abbreviation: "ARI" },
  { name: "Atlanta Falcons", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png", abbreviation: "ATL" },
  { name: "Baltimore Ravens", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png", abbreviation: "BAL" },
  { name: "Buffalo Bills", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png", abbreviation: "BUF" },
  { name: "Carolina Panthers", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png", abbreviation: "CAR" },
  { name: "Chicago Bears", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png", abbreviation: "CHI" },
  { name: "Cincinnati Bengals", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png", abbreviation: "CIN" },
  { name: "Cleveland Browns", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png", abbreviation: "CLE" },
  { name: "Dallas Cowboys", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png", abbreviation: "DAL" },
  { name: "Denver Broncos", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png", abbreviation: "DEN" },
  { name: "Detroit Lions", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png", abbreviation: "DET" },
  { name: "Green Bay Packers", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png", abbreviation: "GB" },
  { name: "Houston Texans", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png", abbreviation: "HOU" },
  { name: "Indianapolis Colts", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png", abbreviation: "IND" },
  { name: "Jacksonville Jaguars", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png", abbreviation: "JAX" },
  { name: "Kansas City Chiefs", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", abbreviation: "KC" },
  { name: "Las Vegas Raiders", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png", abbreviation: "LV" },
  { name: "Los Angeles Chargers", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png", abbreviation: "LAC" },
  { name: "Los Angeles Rams", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png", abbreviation: "LAR" },
  { name: "Miami Dolphins", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png", abbreviation: "MIA" },
  { name: "Minnesota Vikings", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png", abbreviation: "MIN" },
  { name: "New England Patriots", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png", abbreviation: "NE" },
  { name: "New Orleans Saints", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png", abbreviation: "NO" },
  { name: "New York Giants", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png", abbreviation: "NYG" },
  { name: "New York Jets", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png", abbreviation: "NYJ" },
  { name: "Philadelphia Eagles", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png", abbreviation: "PHI" },
  { name: "Pittsburgh Steelers", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png", abbreviation: "PIT" },
  { name: "San Francisco 49ers", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png", abbreviation: "SF" },
  { name: "Seattle Seahawks", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png", abbreviation: "SEA" },
  { name: "Tampa Bay Buccaneers", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png", abbreviation: "TB" },
  { name: "Tennessee Titans", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png", abbreviation: "TEN" },
  { name: "Washington Commanders", logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png", abbreviation: "WSH" },
];

// Function to get team logo by name (case-insensitive)
export function getTeamLogo(teamName: string): TeamLogo | null {
  const normalizedName = teamName.toLowerCase().trim();
  
  // Try exact match first
  let team = NFL_TEAMS.find(t => t.name.toLowerCase() === normalizedName);
  
  // If no exact match, try partial matches
  if (!team) {
    team = NFL_TEAMS.find(t => 
      t.name.toLowerCase().includes(normalizedName) || 
      normalizedName.includes(t.name.toLowerCase()) ||
      t.abbreviation.toLowerCase() === normalizedName
    );
  }
  
  return team || null;
}

// Function to get team logo URL by name
export function getTeamLogoUrl(teamName: string): string | null {
  const team = getTeamLogo(teamName);
  return team?.logoUrl || null;
}

// Function to get team abbreviation by name
export function getTeamAbbreviation(teamName: string): string | null {
  const team = getTeamLogo(teamName);
  return team?.abbreviation || null;
} 