import Source from '../models/Source.js';
import StudySession from '../models/StudySession.js';
import { queryLLM } from '../services/aiService.js';

// Predefined medical diagrams database for 100% accuracy and layout quality
const HIGH_YIELD_DIAGRAMS = {
  'brachial plexus': {
    title: 'Brachial Plexus Nerve Network',
    type: 'neural',
    nodes: [
      { id: '1', label: 'C5 Root', x: 80, y: 70, description: 'Anterior ramus of C5 spinal nerve' },
      { id: '2', label: 'C6 Root', x: 80, y: 130, description: 'Anterior ramus of C6 spinal nerve' },
      { id: '3', label: 'C7 Root', x: 80, y: 190, description: 'Anterior ramus of C7 spinal nerve' },
      { id: '4', label: 'C8 Root', x: 80, y: 250, description: 'Anterior ramus of C8 spinal nerve' },
      { id: '5', label: 'T1 Root', x: 80, y: 310, description: 'Anterior ramus of T1 spinal nerve' },
      
      { id: '6', label: 'Upper Trunk', x: 200, y: 100, description: 'Fusion of C5 & C6' },
      { id: '7', label: 'Middle Trunk', x: 200, y: 190, description: 'Continuation of C7' },
      { id: '8', label: 'Lower Trunk', x: 200, y: 280, description: 'Fusion of C8 & T1' },
      
      { id: '9', label: 'Lateral Cord', x: 360, y: 100, description: 'Anterior divisions of Upper & Middle' },
      { id: '10', label: 'Posterior Cord', x: 360, y: 190, description: 'Posterior divisions of all trunks' },
      { id: '11', label: 'Medial Cord', x: 360, y: 280, description: 'Anterior division of Lower' },
      
      { id: '12', label: 'Musculocutaneous N.', x: 520, y: 70, description: 'Branch of Lateral Cord' },
      { id: '13', label: 'Axillary Nerve', x: 520, y: 130, description: 'Branch of Posterior Cord' },
      { id: '14', label: 'Radial Nerve', x: 520, y: 190, description: 'Branch of Posterior Cord' },
      { id: '15', label: 'Median Nerve', x: 520, y: 250, description: 'Branches of Lateral & Medial Cords' },
      { id: '16', label: 'Ulnar Nerve', x: 520, y: 310, description: 'Branch of Medial Cord' }
    ],
    connections: [
      { from: '1', to: '6', label: 'unites' },
      { from: '2', to: '6', label: 'unites' },
      { from: '3', to: '7', label: 'continues' },
      { from: '4', to: '8', label: 'unites' },
      { from: '5', to: '8', label: 'unites' },
      { from: '6', to: '9', label: 'division' },
      { from: '6', to: '10', label: 'division' },
      { from: '7', to: '9', label: 'division' },
      { from: '7', to: '10', label: 'division' },
      { from: '8', to: '10', label: 'division' },
      { from: '8', to: '11', label: 'division' },
      { from: '9', to: '12', label: 'branch' },
      { from: '9', to: '15', label: 'branch' },
      { from: '10', to: '13', label: 'branch' },
      { from: '10', to: '14', label: 'branch' },
      { from: '11', to: '15', label: 'branch' },
      { from: '11', to: '16', label: 'branch' }
    ]
  },
  'nephron': {
    title: 'Nephron Functional Anatomy',
    type: 'anatomical',
    nodes: [
      { id: '1', label: 'Glomerulus', x: 180, y: 80, description: 'High-pressure capillary bed for filtration' },
      { id: '2', label: 'Bowman\'s Capsule', x: 180, y: 150, description: 'Receives filtrate from glomerulus' },
      { id: '3', label: 'Proximal Tubule (PCT)', x: 300, y: 150, description: 'Reabsorbs water, ions, and organic nutrients' },
      { id: '4', label: 'Loop of Henle', x: 300, y: 320, description: 'Countercurrent multiplier for concentration' },
      { id: '5', label: 'Distal Tubule (DCT)', x: 420, y: 150, description: 'Selective secretion & reabsorption' },
      { id: '6', label: 'Collecting Duct', x: 420, y: 320, description: 'Final water reabsorption under ADH control' }
    ],
    connections: [
      { from: '1', to: '2', label: 'filters' },
      { from: '2', to: '3', label: 'flows' },
      { from: '3', to: '4', label: 'descends' },
      { from: '4', to: '5', label: 'ascends' },
      { from: '5', to: '6', label: 'drains' }
    ]
  },
  'heart': {
    title: 'Internal Cardiac Structure & Flow',
    type: 'organ',
    nodes: [
      { id: '1', label: 'Vena Cava', x: 100, y: 160, description: 'Brings deoxygenated blood to heart' },
      { id: '2', label: 'Right Atrium', x: 220, y: 160, description: 'Receives venous blood' },
      { id: '3', label: 'Right Ventricle', x: 220, y: 280, description: 'Pumps blood to lungs' },
      { id: '4', label: 'Pulmonary Trunk', x: 340, y: 100, description: 'Carries blood to pulmonary circulation' },
      { id: '5', label: 'Left Atrium', x: 460, y: 160, description: 'Receives oxygenated blood from lungs' },
      { id: '6', label: 'Left Ventricle', x: 460, y: 280, description: 'Pumps blood into aorta (thickest walls)' },
      { id: '7', label: 'Aorta', x: 340, y: 40, description: 'Main systemic arterial branch' }
    ],
    connections: [
      { from: '1', to: '2', label: 'fills' },
      { from: '2', to: '3', label: 'tricuspid' },
      { from: '3', to: '4', label: 'pulmonic' },
      { from: '5', to: '6', label: 'mitral' },
      { from: '6', to: '7', label: 'aortic' }
    ]
  },
  'cranial nerves': {
    title: 'Cranial Nerve Brainstem Origins',
    type: 'neural',
    nodes: [
      { id: '1', label: 'Cerebrum (CN I-II)', x: 180, y: 70, description: 'Olfactory & Optic nerves input' },
      { id: '2', label: 'Midbrain (CN III-IV)', x: 180, y: 150, description: 'Oculomotor & Trochlear' },
      { id: '3', label: 'Pons (CN V-VIII)', x: 180, y: 230, description: 'Trigeminal, Abducens, Facial, Vestibulocochlear' },
      { id: '4', label: 'Medulla (CN IX-XII)', x: 180, y: 310, description: 'Glossopharyngeal, Vagus, Accessory, Hypoglossal' },
      
      { id: '5', label: 'CN I (Olfactory)', x: 400, y: 40, description: 'Sensory: Smell' },
      { id: '6', label: 'CN II (Optic)', x: 400, y: 100, description: 'Sensory: Vision' },
      { id: '7', label: 'CN III (Oculomotor)', x: 400, y: 160, description: 'Motor: Eye movements' },
      { id: '8', label: 'CN V (Trigeminal)', x: 400, y: 220, description: 'Mixed: Face sensation & chewing' },
      { id: '9', label: 'CN VII (Facial)', x: 400, y: 280, description: 'Mixed: Face muscles & taste' },
      { id: '10', label: 'CN X (Vagus)', x: 400, y: 340, description: 'Mixed: Autonomic parasympathetic output' }
    ],
    connections: [
      { from: '1', to: '5' },
      { from: '1', to: '6' },
      { from: '2', to: '7' },
      { from: '3', to: '8' },
      { from: '3', to: '9' },
      { from: '4', to: '10' }
    ]
  },
  'circle of willis': {
    title: 'Circle of Willis Cerebral Circulation',
    type: 'vascular',
    nodes: [
      { id: '1', label: 'Vertebral Arteries', x: 250, y: 340, description: 'Ascend through transverse foramina' },
      { id: '2', label: 'Basilar Artery', x: 250, y: 270, description: 'Runs along pons anterior surface' },
      { id: '3', label: 'Posterior Cerebral', x: 150, y: 210, description: 'Supplies occipital lobe' },
      { id: '4', label: 'Posterior Comm.', x: 150, y: 150, description: 'Connects anterior & posterior' },
      { id: '5', label: 'Internal Carotid', x: 250, y: 120, description: 'Primary anterior circulation source' },
      { id: '6', label: 'Middle Cerebral', x: 370, y: 120, description: 'Supplies lateral hemispheres' },
      { id: '7', label: 'Anterior Cerebral', x: 250, y: 70, description: 'Supplies medial hemispheres' },
      { id: '8', label: 'Anterior Comm.', x: 250, y: 30, description: 'Connects left & right anterior' }
    ],
    connections: [
      { from: '1', to: '2' },
      { from: '2', to: '3' },
      { from: '3', to: '4' },
      { from: '4', to: '5' },
      { from: '5', to: '6' },
      { from: '5', to: '7' },
      { from: '7', to: '8' }
    ]
  },
  'blood coagulation': {
    title: 'Coagulation Cascade Sequence',
    type: 'flowchart',
    nodes: [
      { id: '1', label: 'Vessel Injury', x: 250, y: 50, description: 'Exposes subendothelial collagen' },
      { id: '2', label: 'Platelet Adhesion', x: 250, y: 110, description: 'Glycoproteins bind vWF factor' },
      { id: '3', label: 'Platelet Activation', x: 250, y: 170, description: 'Releases thromboxane A2 & ADP' },
      { id: '4', label: 'Coagulation Cascade', x: 250, y: 230, description: 'Intrinsic & Extrinsic pathways merge' },
      { id: '5', label: 'Thrombin Gen.', x: 250, y: 290, description: 'Converts fibrinogen into fibrin' },
      { id: '6', label: 'Stable Fibrin Clot', x: 250, y: 350, description: 'Cross-linked clot protects injury site' }
    ],
    connections: [
      { from: '1', to: '2' },
      { from: '2', to: '3' },
      { from: '3', to: '4' },
      { from: '4', to: '5' },
      { from: '5', to: '6' }
    ]
  }
};

export const generateDiagram = async (req, res) => {
  try {
    const { workspaceId, topic, diagramType } = req.body;

    if (!workspaceId || !topic) {
      return res.status(400).json({ error: 'Workspace ID and Topic are required' });
    }

    const normalizedTopic = topic.toLowerCase().trim();
    
    // 1. Check Predefined high-yield diagrams
    const matchedKey = Object.keys(HIGH_YIELD_DIAGRAMS).find(key => normalizedTopic.includes(key));
    if (matchedKey) {
      const diagram = HIGH_YIELD_DIAGRAMS[matchedKey];
      return res.status(200).json({
        ...diagram,
        isGeneralKnowledge: false
      });
    }

    // 2. Scan workspace files to determine source-grounded terminology
    const sources = await Source.find({ workspaceId, status: 'ready' });
    let contextText = '';
    let isGeneralKnowledge = true;

    if (sources && sources.length > 0) {
      // Find files mentioning the topic keyword
      const keywordRegex = new RegExp(topic.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      const matchingSources = sources.filter(s => keywordRegex.test(s.rawText));
      
      if (matchingSources.length > 0) {
        contextText = matchingSources.map(s => s.rawText.substring(0, 1500)).join('\n');
        isGeneralKnowledge = false;
      }
    }

    // 3. Fallback to LLM diagram generation
    const systemPrompt = `You are a professional medical visual illustrator and academic tutor.
Generate a structured, labeled diagram for the topic: "${topic}" of diagram format type: "${diagramType || 'anatomical'}".
${contextText ? `PRIORITIZE terms, definitions, and organization from these student uploads:\n${contextText.substring(0, 3000)}\n` : ''}
The response MUST be a valid JSON object matching the following structure:
{
  "title": "Clean Title of Diagram",
  "type": "anatomical" | "flowchart" | "process" | "organ" | "neural" | "vascular",
  "nodes": [
    { "id": "1", "label": "Structure Name", "x": 100, "y": 120, "description": "Brief explanation of structure/function" }
  ],
  "connections": [
    { "from": "1", "to": "2", "label": "relationship label" }
  ]
}

Layout guidelines:
- Center or spread the nodes cleanly within an coordinate plane of 0 to 600.
- Nodes must NOT overlap or share coordinates.
- Ensure leader lines/arrows have clear source and targets.
- Use correct medical terminology.
- Do not wrap the JSON output in markdown blocks or backticks. Return raw JSON.`;

    const userPrompt = `Generate a labeled ${diagramType || 'anatomical'} diagram for "${topic}".`;

    console.log(`Querying LLM for medical diagram: ${topic} (${diagramType})`);
    const diagramJson = await queryLLM(systemPrompt, userPrompt, true);

    return res.status(200).json({
      ...diagramJson,
      isGeneralKnowledge
    });

  } catch (error) {
    console.error('Diagram generation controller error:', error);
    return res.status(500).json({ error: `Failed to generate diagram: ${error.message}` });
  }
};

export const saveDiagramToWorkspace = async (req, res) => {
  try {
    const { workspaceId, sessionId, topic, subject, diagramData } = req.body;

    if (!workspaceId || !diagramData) {
      return res.status(400).json({ error: 'Workspace ID and diagramData are required' });
    }

    // If study session ID is provided, append it directly to the session record
    if (sessionId) {
      const session = await StudySession.findById(sessionId);
      if (session) {
        const visualItem = {
          type: 'diagram',
          data: diagramData,
          savedAt: new Date()
        };
        session.visualLearning = session.visualLearning || [];
        session.visualLearning.push(visualItem);
        await session.save();
        return res.status(201).json(session);
      }
    }

    // Fallback: look up session by workspaceId + topic
    const matchedSession = await StudySession.findOne({ workspaceId, topic: topic || '' });
    if (matchedSession) {
      const visualItem = {
        type: 'diagram',
        data: diagramData,
        savedAt: new Date()
      };
      matchedSession.visualLearning = matchedSession.visualLearning || [];
      matchedSession.visualLearning.push(visualItem);
      await matchedSession.save();
      return res.status(201).json(matchedSession);
    }

    // If no session exists, create a new one to persist the diagram
    const newSession = new StudySession({
      workspaceId,
      topic: topic || 'General Concepts',
      subject: subject || 'Physiology',
      progress: 15,
      totalStudyTime: 5,
      visualLearning: [{
        type: 'diagram',
        data: diagramData,
        savedAt: new Date()
      }]
    });
    await newSession.save();
    return res.status(201).json(newSession);

  } catch (error) {
    console.error('Save diagram error:', error);
    return res.status(500).json({ error: `Failed to save diagram: ${error.message}` });
  }
};
