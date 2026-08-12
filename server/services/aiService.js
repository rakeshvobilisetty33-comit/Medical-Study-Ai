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

const MOCK_TOPICS = {
  'brachial plexus': `### 1. Introduction & Overview
The brachial plexus is a somatic network of nerves formed by the anterior rami of the lower four cervical nerves and the first thoracic nerve (C5, C6, C7, C8, and T1). It provides motor and sensory innervation to the shoulder, arm, forearm, and hand.

### 2. Anatomical Structure & Segments
* **Roots (C5-T1)**: The anterior rami of C5, C6, C7, C8, and T1.
* **Trunks**:
  - *Superior Trunk*: Fusion of C5 and C6 roots.
  - *Middle Trunk*: Continuation of C7 root.
  - *Inferior Trunk*: Fusion of C8 and T1 roots.
* **Divisions**: Each trunk splits into *anterior* (supplies flexor/pronator muscles) and *posterior* (supplies extensor/supinator muscles) divisions.
* **Cords**:
  - *Lateral Cord*: Formed by anterior divisions of upper & middle trunks.
  - *Medial Cord*: Continuation of anterior division of lower trunk.
  - *Posterior Cord*: Formed by posterior divisions of all three trunks.
* **Terminal Branches (Nerves)**:
  - *Musculocutaneous (C5-C7)*: Innervates flexors of the arm (e.g., biceps brachii).
  - *Axillary (C5-C6)*: Innervates deltoid and teres minor.
  - *Radial (C5-T1)*: Innervates extensors of arm & forearm.
  - *Median (C5-T1)*: Innervates flexors in the forearm and hand.
  - *Ulnar (C8-T1)*: Innervates intrinsic muscles of the hand.

### 3. Key Clinical Diagnostic Features & Lesions
* **Erb's Palsy (Waiter's Tip Deformity)**: Injury to the upper trunk (C5-C6) due to excessive neck traction (e.g., birth trauma or motorcycle falls). Affected arm hangs by the side, pronated, and medially rotated.
* **Klumpke's Palsy (Claw Hand)**: Injury to the lower trunk (C8-T1) due to sudden upward arm pull (e.g., catching a branch during a fall). Leads to claw hand posture from loss of intrinsic hand muscles.`,

  'anatomy': `### 1. Overview of Anatomy
Human anatomy is the study of the structure of the human body, from microscopic cells to large organ systems. In medical study, anatomy is typically divided into gross anatomy (macroscopic structure) and histology (microscopic structure).

### 2. Primary Systems of Gross Anatomy
* **Musculoskeletal System**: Bones, joints, ligaments, and muscles that provide framework and movement.
* **Cardiovascular System**: Heart and blood vessels responsible for distributing oxygen and nutrients.
* **Nervous System**: Brain, spinal cord, and peripheral nerves mediating coordination, sensation, and motor control.
* **Respiratory System**: Lungs and airway passages facilitating gas exchange.
* **Gastrointestinal System**: Organs from esophagus to colon processing nutrients and waste.

### 3. High-Yield Exam Summary
* **Anatomical Position**: Always describe relationships (anterior, posterior, medial, lateral) relative to a person standing erect, palms facing forward.
* **Vascular Relations**: Major vessels run with corresponding nerves; know the contents of spaces like the femoral triangle and axillary sheath.`,

  'cardiac cycle': `### 1. Introduction & Overview
The cardiac cycle refers to the sequence of electrical and mechanical events that occur from the beginning of one heartbeat to the beginning of the next. It involves alternating periods of contraction (systole) and relaxation (diastole).

### 2. Phases of the Cardiac Cycle
* **Isovolumetric Ventricular Contraction**: Mitral/Tricuspid valves close (S1 sound). Ventricles contract with no volume change, raising pressure rapidly.
* **Ventricular Ejection**: Aortic/Pulmonic valves open. Blood is pumped into systemic and pulmonary circulation.
* **Isovolumetric Ventricular Relaxation**: Aortic/Pulmonic valves close (S2 sound). Ventricles relax with no volume change.
* **Late Diastole & Rapid Filling**: Mitral/Tricuspid valves open. Ventricles fill passively.
* **Atrial Systole**: Atria contract (gives the final active 20% filling boost, corresponding to the "A-wave" on atrial pressure curves).

### 3. High-Yield Exam Summary
* **Heart Sounds**: 
  - **S1 ("lub")**: Closure of AV valves (mitral and tricuspid).
  - **S2 ("dup")**: Closure of semilunar valves (aortic and pulmonary).
  - **S3**: Heard in rapid ventricular filling (associated with volume overload, e.g., dilated cardiomyopathy).
  - **S4**: Heard in atrial contraction against a stiff ventricle (hypertrophic cardiomyopathy).`
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
  const topicMatch = userPrompt.match(/(?:what is|explain|about|describe|topic|for)\s+the\s+([a-zA-Z\s\-]{3,30})/i) ||
                     userPrompt.match(/(?:what is|explain|about|describe|topic|for)\s+([a-zA-Z\s\-]{3,30})/i) ||
                     userPrompt.match(/question:\s+([a-zA-Z\s\-]{3,30})/i);
  if (topicMatch && topicMatch[1]) {
    topic = topicMatch[1].trim();
  }

  // 1. IF JSON MODE IS REQUESTED (Quizzes & Flashcards)
  if (jsonMode) {
    // Generate Visual pathways flowchart/mindmap
    if (lowerPrompt.includes('visual') || systemPrompt.includes('visual designer') || lowerPrompt.includes('flowchart') || lowerPrompt.includes('mindmap')) {
      const isMindmap = lowerPrompt.includes('mindmap') || systemPrompt.includes('mindmap') || systemPrompt.includes('mind map');
      if (isMindmap) {
        return {
          type: 'mindmap',
          title: `Visual Mindmap of ${topic}`,
          nodes: [
            { id: '1', label: topic, description: `Central physiological theme of ${topic}` },
            { id: '2', label: 'Primary Mechanism', description: 'Underlying molecular triggers and receptor pathways' },
            { id: '3', label: 'Clinical Indicators', description: 'Signs, symptoms, and diagnostic parameters' },
            { id: '4', label: 'Complications', description: 'Risks of progression and long-term sequelae' },
            { id: '5', label: 'Enzymatic Cascade', description: 'Involved intracellular signal transduction' },
            { id: '6', label: 'Lab Biomarkers', description: 'Diagnostic assay markers and serum readings' }
          ],
          edges: [
            { source: '1', target: '2', label: 'anatomical branch' },
            { source: '1', target: '3', label: 'clinical branch' },
            { source: '1', target: '4', label: 'pathological branch' },
            { source: '2', target: '5', label: 'activates' },
            { source: '3', target: '6', label: 'detects' }
          ]
        };
      } else {
        return {
          type: 'flowchart',
          title: `Clinical Flowchart for ${topic}`,
          nodes: [
            { id: '1', label: 'Initial Triggers', description: `Acute onset factors causing stress on ${topic}` },
            { id: '2', label: 'Physiological Compensation', description: 'Sympathetic response and homeostatic activation' },
            { id: '3', label: 'Pathway Decision', description: 'Is perfusion maintained?' },
            { id: '4', label: 'Resolution', description: 'Recovery and restoration of baseline function' },
            { id: '5', label: 'Pathological Decline', description: 'Cellular injury, fibrosis, and decompensation' }
          ],
          edges: [
            { source: '1', target: '2', label: 'initiates' },
            { source: '2', target: '3', label: 'leads to evaluation' },
            { source: '3', target: '4', label: 'Yes (Adequate Perfusion)' },
            { source: '3', target: '5', label: 'No (Ischemia/Failure)' }
          ]
        };
      }
    }

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
      const numQuestionsMatch = systemPrompt.match(/generate exactly (\d+)/i) ||
                                systemPrompt.match(/(\d+)\s+multiple-choice/i) ||
                                userPrompt.match(/generate (\d+)/i);
      const numQuestions = numQuestionsMatch ? parseInt(numQuestionsMatch[1], 10) : 5;

      const templates = [
        {
          question: `Which of the following is considered a primary diagnostic marker for {topic}?`,
          options: [
            'Elevated serum creatinine & urea',
            'Increased localized tissue perfusion',
            'Decreased inflammatory cytokine activity',
            'Normal cerebrospinal fluid pressure'
          ],
          correctAnswer: 'Elevated serum creatinine & urea',
          explanation: `In standard clinical assessments of {topic}, biomarkers reflect organ clearance capacity. Elevated values point directly to clearance failure.`,
          difficulty: 'medium',
          topic: topic
        },
        {
          question: `What is the recommended first-line therapeutic management for acute {topic}?`,
          options: [
            'Symptomatic care and supportive hydration',
            'High-dose aggressive surgical resection',
            'Broad-spectrum antimicrobial therapy without cultures',
            'Immediate long-term immunosuppression'
          ],
          correctAnswer: 'Symptomatic care and supportive hydration',
          explanation: `Supportive hydration stabilizes circulatory volume and ensures organ perfusion during acute exacerbation of {topic}.`,
          difficulty: 'easy',
          topic: topic
        },
        {
          question: `A patient presenting with advanced {topic} is at highest risk for which of the following complications?`,
          options: [
            'Chronic fibrosis and irreversible tissue remodelling',
            'Infectious bacterial meningitis',
            'Spontaneous resolution within 24 hours',
            'Acute respiratory alkalosis'
          ],
          correctAnswer: 'Chronic fibrosis and irreversible tissue remodelling',
          explanation: `Persistent unchecked inflammation from {topic} leads to fibroblast recruitment, deposition of extracellular matrix, and eventual scarring.`,
          difficulty: 'hard',
          topic: topic
        },
        {
          question: `Which physiological pathway is most directly disrupted in advanced stages of {topic}?`,
          options: [
            'Cellular energy production via mitochondrial dysfunction',
            'Systemic lymphatic fluid absorption rate',
            'Synaptic neurotransmission in the motor cortex',
            'Hepatic glycogen synthesis rate'
          ],
          correctAnswer: 'Cellular energy production via mitochondrial dysfunction',
          explanation: `Mitochondrial damage is a key cellular hallmark in severe tissue injury associated with {topic}, causing ATP depletion.`,
          difficulty: 'medium',
          topic: topic
        },
        {
          question: `What is the classical clinical sign observed during physical examination of a patient with suspected {topic}?`,
          options: [
            'Localized tenderness and swelling over the affected area',
            'Generalized petechiae and mucosal bleeding',
            'Bilateral papilledema and cranial nerve palsy',
            'Hyper-resonance on thoracic percussion'
          ],
          correctAnswer: 'Localized tenderness and swelling over the affected area',
          explanation: `Localized inflammation from {topic} triggers classical cardinal signs of inflammation, including rubor, calor, tumor, and dolor.`,
          difficulty: 'easy',
          topic: topic
        }
      ];

      const mockQuestions = [];
      for (let i = 0; i < numQuestions; i++) {
        const template = templates[i % templates.length];
        
        // Shuffle options for each question so that the correct answer is not always options[0] (A)
        const shuffledOptions = [...template.options];
        for (let j = shuffledOptions.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [shuffledOptions[j], shuffledOptions[k]] = [shuffledOptions[k], shuffledOptions[j]];
        }

        mockQuestions.push({
          question: `${i + 1}. ${template.question.replace(/{topic}/g, topic)}`,
          options: shuffledOptions,
          correctAnswer: template.correctAnswer,
          explanation: template.explanation.replace(/{topic}/g, topic),
          difficulty: template.difficulty,
          topic: template.topic
        });
      }
      return mockQuestions;
    }

    // Default JSON structure
    return { status: 'success', data: `Mock content generated for ${topic}` };
  }

  // 2. TEXT/MARKDOWN MODE (Chat, Summaries, Guides, Mnemonics, Comparisons)
  
  // Focus Topic
  if (lowerPrompt.includes('focus') || lowerPrompt.includes('study focus') || systemPrompt.includes('Focus Topic')) {
    return `# Focus Topic: ${topic}

## Overview
Comprehensive analysis of ${topic} based on the uploaded syllabus materials.

## Key Concepts
High-yield conceptual breakdown of this topic:
1. **Physiological cascade**: The step-by-step trigger sequence causing state activation.
2. **Receptor kinetics**: Binding affinities and feedback regulation.

## Important Facts
- Normal structural properties are required for functional activity.
- Active states require biochemical cofactor binding.

## High-Yield Points
- **Clinical correlation**: Symptoms present when normal pathways are obstructed.
- **Key marker**: Elevated diagnostic enzymes confirm local tissue stress.

## Relevant Explanations
Detailed clinical review of ${topic} pathophysiology confirms cellular integrity depends directly on ATP presence and membrane stability.

## Common Mistakes & Confusions
* **Confusion**: Confusing early compensatory phases with decompensation signs.
* **Avoid**: Assuming normal lab levels always rule out chronic progressions.

## Important Terms
- **Homeostasis**: Active maintenance of dynamic equilibrium.
- **Decompensation**: Failure of compensatory mechanics under prolonged workload.

## Suggested Revision Points
- Diagnostic lab limits and standard diagnostic protocols.
- Pharmacotherapy dosing ranges and contraindications.`;
  }
  
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
    const normalizedTopic = topic.toLowerCase();
    const matchedKey = Object.keys(MOCK_TOPICS).find(key => normalizedTopic.includes(key));
    if (matchedKey) {
      responseBody = MOCK_TOPICS[matchedKey];
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
  }

  return `## ${topic} — ${modeHeading}

${responseBody}

> [!NOTE]
> *This is educational material generated by MedStudy AI's RAG system. Always cross-reference with standard textbooks (e.g., Guyton, Robbins, Harrison's) before exams.*`;
};
