import Source from '../models/Source.js';

// Basic English stopwords to filter out for keyword search
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have',
  'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt',
  'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such',
  'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres',
  'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent',
  'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom',
  'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve',
  'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Tokenize a text string by lowercasing and splitting by non-alphanumeric chars.
 */
const tokenize = (text) => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(token => token.length > 1);
};

/**
 * Retrieve the most relevant chunks from the sources in a workspace.
 */
export const retrieveRelevantChunks = async (workspaceId, query, limit = 5) => {
  try {
    // 1. Fetch all processed sources in this workspace
    const sources = await Source.find({ workspaceId, status: 'ready' });
    if (!sources || sources.length === 0) {
      return [];
    }

    // 2. Tokenize query and filter stopwords
    const queryTokens = tokenize(query).filter(token => !STOPWORDS.has(token));
    if (queryTokens.length === 0) {
      // Fallback to basic tokenization if query is empty or full of stopwords
      queryTokens.push(...tokenize(query));
    }

    // 3. Compile all chunks with metadata
    const allChunks = [];
    sources.forEach(source => {
      source.chunks.forEach(chunk => {
        allChunks.push({
          sourceId: source._id,
          sourceName: source.filename,
          text: chunk.text,
          pageNumber: chunk.pageNumber || 1,
          chunkIndex: chunk.chunkIndex
        });
      });
    });

    // 4. Rank chunks based on frequency and proximity of query tokens
    const scoredChunks = allChunks.map(chunk => {
      const chunkTokens = tokenize(chunk.text);
      let score = 0;

      queryTokens.forEach(queryToken => {
        // Count matches
        const matches = chunkTokens.filter(t => t === queryToken).length;
        if (matches > 0) {
          score += matches * 10; // term frequency boost
        }
      });

      // Exact phrase match boost
      const lowerText = chunk.text.toLowerCase();
      const lowerQuery = query.toLowerCase().trim();
      if (lowerText.includes(lowerQuery)) {
        score += 100;
      }

      // Short phrase fragments matching boost
      if (queryTokens.length > 1) {
        for (let i = 0; i < queryTokens.length - 1; i++) {
          const bigram = `${queryTokens[i]} ${queryTokens[i+1]}`;
          if (lowerText.includes(bigram)) {
            score += 30;
          }
        }
      }

      return {
        ...chunk,
        score
      };
    });

    // 5. Filter out zero scores (unless no matches at all, then return top sorted chunks)
    let filtered = scoredChunks.filter(c => c.score > 0);
    if (filtered.length === 0) {
      filtered = scoredChunks; // fallback to everything if query yielded zero matches
    }

    // 6. Sort descending by score and return top results
    filtered.sort((a, b) => b.score - a.score);
    return filtered.slice(0, limit);
  } catch (err) {
    console.error('Error during text chunk retrieval:', err);
    return [];
  }
};
