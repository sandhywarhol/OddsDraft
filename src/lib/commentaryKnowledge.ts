import knowledgeData from './commentaryKnowledge.json';

export interface CommentaryData {
  Pemain?: string[];
  'World Cup'?: string[];
  'Gaya Bermain'?: string[];
  Sejarah?: string[];
  'Prediction Tips'?: string[];
}

const commentaryDB: Record<string, CommentaryData> = knowledgeData;

export function getRandomTeamFact(teamName: string, category?: keyof CommentaryData): string | null {
  const teamData = commentaryDB[teamName];
  if (!teamData) return null;

  if (category) {
    const facts = teamData[category];
    if (facts && facts.length > 0) {
      const randomIndex = Math.floor(Math.random() * facts.length);
      return facts[randomIndex];
    }
  } else {
    // Pick a random category
    const categories = Object.keys(teamData) as Array<keyof CommentaryData>;
    if (categories.length === 0) return null;
    
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const facts = teamData[randomCategory];
    
    if (facts && facts.length > 0) {
      const randomIndex = Math.floor(Math.random() * facts.length);
      return facts[randomIndex];
    }
  }
  
  return null;
}
