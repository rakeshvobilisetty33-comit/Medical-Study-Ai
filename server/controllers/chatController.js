import StudySession from '../models/StudySession.js';
import Source from '../models/Source.js';
import { retrieveRelevantChunks } from '../services/retrievalService.js';
import { queryLLM } from '../services/aiService.js';
import { processCitations } from '../services/citationService.js';

export const handleChat = async (req, res) => {
  try {
    const { workspaceId, message, sessionId } = req.body;

    if (!workspaceId || !message) {
      return res.status(400).json({ error: 'Workspace ID and message text are required' });
    }

    // 1. Fetch or create StudySession
    let session;
    if (sessionId) {
      session = await StudySession.findById(sessionId);
    }
    if (!session) {
      session = new StudySession({ workspaceId, messages: [] });
    }

    // 2. Retrieve relevant chunks for context
    const relevantChunks = await retrieveRelevantChunks(workspaceId, message, 4);

    let systemPrompt = '';
    let userPrompt = '';
    let responseText = '';
    let citations = [];
    let isGeneralKnowledge = false;

    if (relevantChunks.length > 0) {
      // Structure RAG prompt
      systemPrompt = `You are MedStudy AI, a premium, highly knowledgeable medical study assistant.
Your goal is to explain concepts clearly, use precise medical terminology, simplify complex mechanisms when helpful, and highlight high-yield points.

Rules for grounding:
1. Prioritize answering based primarily on the uploaded study materials provided in the Context block.
2. If the answer cannot be found in the provided Context, start your reply with the exact text: "I couldn't find this information in your uploaded study materials." and then provide general medical facts in a section titled "Additional Medical Knowledge:".
3. Do not make up citations or page numbers. Include inline tags like [Source: <filename>, Page: <page_number>] if the answer matches a specific page.
4. Keep the explanation professional and structured. Use Markdown tables, lists, and bold headings.`;

      const contextBlock = relevantChunks.map((chunk, index) => {
        return `[Source #${index + 1}: ${chunk.sourceName}, Page: ${chunk.pageNumber}]\n${chunk.text}\n`;
      }).join('\n');

      userPrompt = `Context:\n${contextBlock}\n\nQuestion: ${message}`;

      // Call LLM
      const aiReply = await queryLLM(systemPrompt, userPrompt, false);
      
      // Parse citations
      const processed = processCitations(aiReply, relevantChunks);
      responseText = processed.text;
      citations = processed.citations;
      isGeneralKnowledge = processed.isGeneralKnowledge;

    } else {
      // No sources uploaded or found in workspace
      isGeneralKnowledge = true;
      systemPrompt = `You are MedStudy AI, a premium medical study assistant.
Since the student has not uploaded any sources yet, reply with:
"I couldn't find this information in your uploaded study materials because no documents have been uploaded to this workspace yet."

Then, provide a high-quality explanation based on general medical knowledge under a clearly labeled heading:
"### Additional Medical Knowledge"`;

      userPrompt = `Question: ${message}`;
      responseText = await queryLLM(systemPrompt, userPrompt, false);
    }

    // 3. Save to database
    session.messages.push({
      sender: 'user',
      text: message,
      timestamp: new Date()
    });

    session.messages.push({
      sender: 'ai',
      text: responseText,
      citations: citations,
      isGeneralKnowledge: isGeneralKnowledge,
      timestamp: new Date()
    });

    await session.save();

    return res.status(200).json({
      message: responseText,
      citations,
      sessionId: session._id,
      isGeneralKnowledge
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: `Failed to generate chat response: ${error.message}` });
  }
};

export const getChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
