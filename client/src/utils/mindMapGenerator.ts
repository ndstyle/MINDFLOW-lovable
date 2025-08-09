interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  children: string[];
}

export const generateMindMapFromText = (text: string): MindMapNode[] => {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length === 0) return [];

  // Extract main topics (longer sentences or sentences with key words)
  const mainTopics = sentences.filter(s => 
    s.length > 20 || 
    /\b(main|important|key|primary|goal|objective|focus)\b/i.test(s)
  );

  // Create central node
  const centralNode: MindMapNode = {
    id: 'central',
    text: mainTopics.length > 0 ? mainTopics[0].substring(0, 30) : sentences[0].substring(0, 30),
    x: 400,
    y: 200,
    level: 0,
    children: []
  };

  const nodes: MindMapNode[] = [centralNode];

  // Create branch nodes from remaining content
  const remainingSentences = sentences.filter(s => s !== centralNode.text);
  const branches = remainingSentences.slice(0, 6); // Limit to 6 branches for clarity

  branches.forEach((branch, index) => {
    const angle = (index * 60) - 150; // Distribute around center
    const radius = 150;
    const x = 400 + Math.cos(angle * Math.PI / 180) * radius;
    const y = 200 + Math.sin(angle * Math.PI / 180) * radius;

    const branchNode: MindMapNode = {
      id: `branch-${index}`,
      text: branch.substring(0, 25),
      x,
      y,
      level: 1,
      children: []
    };

    nodes.push(branchNode);
    centralNode.children.push(branchNode.id);

    // Create sub-branches for longer content
    const words = branch.split(/\s+/).filter(w => w.length > 3);
    if (words.length > 5) {
      const subBranches = words.slice(0, 3);
      
      subBranches.forEach((subWord, subIndex) => {
        const subAngle = angle + (subIndex - 1) * 30;
        const subRadius = 80;
        const subX = x + Math.cos(subAngle * Math.PI / 180) * subRadius;
        const subY = y + Math.sin(subAngle * Math.PI / 180) * subRadius;

        const subNode: MindMapNode = {
          id: `sub-${index}-${subIndex}`,
          text: subWord,
          x: subX,
          y: subY,
          level: 2,
          children: []
        };

        nodes.push(subNode);
        branchNode.children.push(subNode.id);
      });
    }
  });

  return nodes;
};