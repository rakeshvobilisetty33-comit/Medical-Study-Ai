/**
 * Helper to process and link citations in AI answers.
 */
export const processCitations = (aiText, retrievedChunks) => {
  const citations = [];

  // If no chunks were retrieved, it's general knowledge
  if (!retrievedChunks || retrievedChunks.length === 0) {
    return {
      text: aiText,
      citations: [],
      isGeneralKnowledge: true
    };
  }

  // Identify which chunks were actually referenced in the response
  // We can scan the text for matching keywords, or if the LLM output inline references like [1], [2], or [Source: filename].
  // As a robust baseline, we include all chunks that contributed to the prompt context,
  // and highlight the most active matches.
  retrievedChunks.forEach((chunk, index) => {
    // Add citation object
    citations.push({
      sourceId: chunk.sourceId,
      sourceName: chunk.sourceName,
      pageNumber: chunk.pageNumber || 1,
      excerpt: chunk.text.substring(0, 180) + '...'
    });
  });

  // Determine if AI answer has grounding or is general knowledge
  const isGeneralKnowledge = aiText.toLowerCase().includes("couldn't find this information") || 
                             aiText.toLowerCase().includes("additional medical knowledge");

  return {
    text: aiText,
    citations,
    isGeneralKnowledge
  };
};
