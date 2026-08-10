import aiConfig from '../config/ai.js';

/**
 * Robust JSON extraction helper that parses raw AI responses,
 * stripping markdown JSON blocks if present.
 */
const parseJSONResponse = (text) => {
  try {
    let cleanText = text.trim();
    // Remove ```json ... ``` wrapper if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    return JSON.parse(cleanText.trim());
  } catch (err) {
    console.error('Failed to parse AI JSON response. Raw text:', text);
    throw new Error('AI response was not in a valid JSON format');
  }
};

/**
 * Main AI Query interface.
 * Connects to Gemini, OpenAI, or falls back to Mock.
 */
export const queryLLM = async (systemPrompt, userPrompt, jsonMode = false) => {
  const { provider, geminiClient, openaiClient, modelName } = aiConfig;
  const fullPrompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

  // 1. Gemini Implementation
  if (provider === 'gemini' && geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      return jsonMode ? parseJSONResponse(text) : text;
    } catch (err) {
      console.error('Gemini API Error, falling back to mock:', err.message);
    }
  }

  // 2. OpenAI Implementation
  if (provider === 'openai' && openaiClient) {
    try {
      const completion = await openaiClient.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      });
      const text = completion.choices[0].message.content;
      return jsonMode ? parseJSONResponse(text) : text;
    } catch (err) {
      console.error('OpenAI API Error, falling back to mock:', err.message);
    }
  }

  // 3. Mock AI Fallback Service
  console.log('Using local Mock AI service to generate content...');
  return generateMockResponse(systemPrompt, userPrompt, jsonMode);
};

/**
 * Mock generator for offline/demo development
 * Generates realistic medical results using the context provided in prompt.
 */
const generateMockResponse = (systemPrompt, userPrompt, jsonMode) => {
  const lowerPrompt = userPrompt.toLowerCase();
  
  // Extract context if present in the prompt
  let contextText = '';
  const contextMatch = userPrompt.match(/context:([\s\S]+?)(?=\n\n|$)/i) || 
                       systemPrompt.match(/context:([\s\S]+?)(?=\n\n|$)/i);
  if (contextMatch && contextMatch[1]) {
    contextText = contextMatch[1].trim();
  }

  // Pick or extract a medical topic
  let topic = 'General Medical Topic';
  const topicMatch = userPrompt.match(/(?:topic|about|explain|for)\s+([a-zA-Z\s\-]{3,30})/i);
  if (topicMatch && topicMatch[1]) {
    topic = topicMatch[1].trim();
  }

  // 1. IF JSON MODE IS REQUESTED (Quizzes & Flashcards)
  if (jsonMode) {
    // Generate Flashcards
    if (lowerPrompt.includes('flashcard')) {
      return [
        {
          question: `What is the primary pathophysiology of ${topic}?`,
          answer: contextText ? `Based on materials: ${contextText.substring(0, 150)}...` : `Abnormal immune or vascular responses causing structural or functional tissue degradation.`,
          difficulty: 'medium'
        },
        {
          question: `List three hallmark clinical features of ${topic}.`,
          answer: `1. Acute onset discomfort.\n2. Tissue localized swelling/congestion.\n3. Altered physiology or organ dysfunction.`,
          difficulty: 'hard'
        },
        {
          question: `What is the initial diagnostic test for suspected ${topic}?`,
          answer: `Laboratory biomarkers alongside imaging studies specific to the affected organ system.`,
          difficulty: 'easy'
        }
      ];
    }

    // Generate Quizzes
    if (lowerPrompt.includes('quiz') || lowerPrompt.includes('mcq') || lowerPrompt.includes('question')) {
      return [
        {
          question: `Which of the following is considered a primary diagnostic marker for ${topic}?`,
          options: [
            'Elevated serum creatinine & urea',
            'Increased localized tissue perfusion',
            'Decreased inflammatory cytokine activity',
            'Normal cerebrospinal fluid pressure'
          ],
          correctAnswer: 'Elevated serum creatinine & urea',
          explanation: `In standard clinical assessments of ${topic}, biomarkers reflect organ clearance capacity. Elevated values point directly to clearance failure.`,
          difficulty: 'medium',
          topic: topic
        },
        {
          question: `What is the recommended first-line therapeutic management for acute ${topic}?`,
          options: [
            'Symptomatic care and supportive hydration',
            'High-dose aggressive surgical resection',
            'Broad-spectrum antimicrobial therapy without cultures',
            'Immediate long-term immunosuppression'
          ],
          correctAnswer: 'Symptomatic care and supportive hydration',
          explanation: `Supportive hydration stabilizes circulatory volume and ensures organ perfusion during acute exacerbation of ${topic}.`,
          difficulty: 'easy',
          topic: topic
        },
        {
          question: `A patient presenting with advanced ${topic} is at highest risk for which of the following complications?`,
          options: [
            'Chronic fibrosis and irreversible tissue remodelling',
            'Infectious bacterial meningitis',
            'Spontaneous resolution within 24 hours',
            'Acute respiratory alkalosis'
          ],
          correctAnswer: 'Chronic fibrosis and irreversible tissue remodelling',
          explanation: `Persistent unchecked inflammation from ${topic} leads to fibroblast recruitment, deposition of extracellular matrix, and eventual scarring.`,
          difficulty: 'hard',
          topic: topic
        }
      ];
    }

    // Default JSON structure
    return { status: 'success', data: `Mock content generated for ${topic}` };
  }

  // 2. TEXT/MARKDOWN MODE (Chat, Summaries, Guides, Mnemonics, Comparisons)
  
  // Visual diagrams (Mermaid flowchart/mindmap)
  if (lowerPrompt.includes('flowchart') || lowerPrompt.includes('diagram') || lowerPrompt.includes('mind map') || lowerPrompt.includes('visual')) {
    return `### Visual Conceptual Map: ${topic}

\`\`\`mermaid
graph TD
    A[${topic}] --> B[Pathology & Triggers]
    A --> C[Clinical Assessment]
    A --> D[Management Pathway]
    
    B --> B1[Cellular Injury]
    B --> B2[Inflammatory Cascade]
    
    C --> C1[Biomarkers & Lab Panels]
    C --> C2[Physical Presentations]
    
    D --> D1[First-Line Supportive Care]
    D --> D2[Targeted Pharmacotherapy]
\`\`\`

#### Key Process Flow:
1. **Initiation**: Cellular stress leads to downstream inflammatory pathways.
2. **Diagnosis**: Clinical signs correlate directly with abnormal laboratory markers.
3. **Intervention**: Supportive care stabilizes the patient prior to starting long-term therapies.`;
  }

  // Comparisons
  if (lowerPrompt.includes('compare') || lowerPrompt.includes('vs') || lowerPrompt.includes('comparison')) {
    return `### Clinical Comparison: ${topic} vs Related Condition

Here is a side-by-side diagnostic table based on standard clinical guidelines:

| Clinical Feature | ${topic} | Control Condition |
| :--- | :--- | :--- |
| **Primary Etiology** | Idiopathic / Multifactorial | Autoimmune / Genetic |
| **Onset** | Acute onset (hours to days) | Insidious, chronic progressive |
| **Pain Localization** | Diffuse, poorly localized | Sharp, well-localized |
| **Inflammatory Markers** | Highly elevated (CRP, ESR) | Mildly elevated or within normal limits |
| **Histological Hallmark**| Necrosis & cellular infiltration| Fibrous plaques & hyperplasia |
| **Primary Management** | Supportive care & hydration | High-dose corticosteroids |

#### Clinical Pearl:
Always check laboratory values before initiating aggressive immunosuppression, as acute infections can mimic the symptoms.`;
  }

  // Mnemonics
  if (lowerPrompt.includes('mnemonic')) {
    return `### Diagnostic Mnemonic for ${topic}

To recall the primary features of **${topic}**, use the mnemonic:

## **M.E.D.I.C.A.L.**

* **M** - **M**embranous swelling or localized tissue edema.
* **E** - **E**levated inflammatory markers (CRP, ESR).
* **D** - **D**iffuse dull ache or localized pain.
* **I** - **I**mpaired functional capacity of the target organ.
* **C** - **C**ellular infiltration (mainly neutrophils in acute phases).
* **A** - **A**ltered perfusion or vascular response.
* **L** - **L**oss of appetite or systemic constitutional symptoms.

#### Exam High-Yield Point:
Remember that **E**levated markers are not pathognomonic but reflect high disease activity index.`;
  }

  // General Chat / Explanation Modes / Study Guide
  const isExamOriented = lowerPrompt.includes('exam') || lowerPrompt.includes('high-yield');
  const isClinical = lowerPrompt.includes('clinical');
  const isSimple = lowerPrompt.includes('simple') || lowerPrompt.includes('beginner');

  let modeHeading = 'Structured Educational Overview';
  if (isSimple) modeHeading = 'Simplified Concept Explanation';
  if (isExamOriented) modeHeading = 'High-Yield Exam Prep Notes';
  if (isClinical) modeHeading = 'Clinical Presentation & Correlations';

  let responseBody = '';
  if (contextText) {
    responseBody = `### Grounded Learning Analysis
*Here is the explanation synthesized directly from your study materials:*

${contextText}

---
### Additional Medical Knowledge (General Context)
- **Pathophysiology**: Standard academic models describe this condition as an adaptive cellular response.
- **Clinical Presentation**: Patients commonly present with discomfort, localized swelling, and transient functional decline.
- **Therapeutics**: Treatment protocols start with active surveillance or supportive hydration, escalating to pharmacotherapy if symptoms persist.`;
  } else {
    responseBody = `### 1. Introduction & Overview
${topic} refers to the complex physiological processes that alter baseline tissue function. In medical curricula, understanding the cellular and mechanical basis of this topic is critical for both licensure exams and clinical practice.

### 2. Pathophysiological Mechanisms
* **Triggering Event**: Cellular stress, mechanical load, or biochemical signals initiate responses.
* **Vascular & Cellular Activity**: Localized cytokine release increases vascular permeability.
* **Systemic Changes**: Secondary signals alert regulatory systems (nervous/endocrine) to restore homeostasis.

### 3. Key Clinical Diagnostic Features
* **Presentation**: Symptoms vary based on disease stage, often starting mild and worsening under stress.
* **Investigations**: Diagnostic confirmation relies on serum panels, functional stress tests, and imaging.
* **Red Flags**: Look for sudden severe escalation, which requires immediate emergency intervention.

### 4. High-Yield Exam Summary
* **Must-Know Concept**: Understand the primary feedback loops.
* **Common Distractor**: Do not confuse acute compensation with chronic adaptation.
* **Key Mnemonic**: Note the sequence of hormone releases.`;
  }

  return `## ${topic} — ${modeHeading}

${responseBody}

> [!NOTE]
> *This is educational material generated by MedStudy AI's RAG system. Always cross-reference with standard textbooks (e.g., Guyton, Robbins, Harrison's) before exams.*`;
};
