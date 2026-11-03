import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// AI Vehicle Part Preset Generator API Endpoint
app.post('/api/ai/preset', async (req, res) => {
  try {
    const { prompt, vehicleInfo } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt description is required.' });
    }

    const ai = getGenAI();

    const systemInstruction = `You are AutoPart 3D AI Specialist, an expert automotive engineer & 3D printing CAD designer.
Analyze the user's description of a broken or custom vehicle part (Context Vehicle: ${JSON.stringify(vehicleInfo || {})}) and recommend exact 3D parametric CAD generator settings.

Available Part Types & Parameters:

1. "bolt": Custom Hex/Socket Bolt
   - headType: "hex" | "socket" | "flange"
   - diameter: number (thread outer diameter mm, e.g. 6 for M6)
   - pitch: number (thread pitch mm, e.g. 1.0)
   - shaftLength: number (threaded length mm)
   - headHeight: number (head height mm)
   - headWidth: number (head width mm)
   - washerFace: boolean

2. "hoseBarb": Hose Adapter / Barb Fitting
   - innerDiameter: number (bore ID mm)
   - outerDiameter: number (base OD mm)
   - length: number (total length mm)
   - barbCount: number (1 to 6)
   - barbDepth: number (barb height ridge mm)
   - wallThickness: number (wall mm)
   - hexGrip: boolean

3. "gasket": Flange Sealing Gasket
   - innerDiameter: number (bore ID mm)
   - outerDiameter: number (gasket OD mm)
   - thickness: number (thickness mm)
   - boltHoleDiameter: number (hole dia mm)
   - boltHoles: number (hole count)
   - pcd: number (pitch circle diameter mm)

4. "knob": Dash Knob / Switch Button
   - diameter: number (knob OD mm)
   - height: number (height mm)
   - shaftDiameter: number (inner hole dia mm)
   - shaftType: "d-shaft" | "round" | "knurled"
   - gripRibs: number (0 to 36)
   - indicatorDot: boolean

5. "bracket": L-Bracket & Mount Adapter
   - length: number (base arm mm)
   - width: number (width mm)
   - height: number (vertical arm mm)
   - thickness: number (wall thickness mm)
   - holeDiameter: number (hole dia mm)
   - holeSpacing: number (hole distance mm)
   - gusset: boolean (diagonal rib)

6. "bushing": Spacer / Suspension Bushing
   - innerDiameter: number (ID mm)
   - outerDiameter: number (OD mm)
   - length: number (height mm)
   - flangeDiameter: number (flange OD mm)
   - flangeThickness: number (flange height mm)

7. "oring": O-Ring Groove Washer / Seal
   - innerDiameter: number (ID mm)
   - outerDiameter: number (OD mm)
   - thickness: number (thickness mm)
   - grooveDepth: number (channel depth mm)
   - grooveWidth: number (channel width mm)

8. "connector": Wiring Harness Connector Shell
   - pinCount: number (pins)
   - rows: number (1 or 2)
   - length: number (body length mm)
   - wireDiameter: number (wire hole dia mm)
   - latchClip: boolean

Filament Material choices: "petg", "asa", "abs", "tpu", "nylon", "cfpc".
Tolerance Offset: recommended fit tolerance offset (+0.05 to +0.30 mm).

Return JSON ONLY matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `User requirement: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            partType: { type: Type.STRING },
            partName: { type: Type.STRING },
            rationale: { type: Type.STRING },
            filamentMaterial: { type: Type.STRING },
            toleranceOffset: { type: Type.NUMBER },
            params: {
              type: Type.OBJECT,
              properties: {
                headType: { type: Type.STRING },
                diameter: { type: Type.NUMBER },
                pitch: { type: Type.NUMBER },
                shaftLength: { type: Type.NUMBER },
                headHeight: { type: Type.NUMBER },
                headWidth: { type: Type.NUMBER },
                washerFace: { type: Type.BOOLEAN },
                innerDiameter: { type: Type.NUMBER },
                outerDiameter: { type: Type.NUMBER },
                length: { type: Type.NUMBER },
                barbCount: { type: Type.NUMBER },
                barbDepth: { type: Type.NUMBER },
                wallThickness: { type: Type.NUMBER },
                hexGrip: { type: Type.BOOLEAN },
                thickness: { type: Type.NUMBER },
                boltHoleDiameter: { type: Type.NUMBER },
                boltHoles: { type: Type.NUMBER },
                pcd: { type: Type.NUMBER },
                height: { type: Type.NUMBER },
                shaftDiameter: { type: Type.NUMBER },
                shaftType: { type: Type.STRING },
                gripRibs: { type: Type.NUMBER },
                indicatorDot: { type: Type.BOOLEAN },
                width: { type: Type.NUMBER },
                holeDiameter: { type: Type.NUMBER },
                holeSpacing: { type: Type.NUMBER },
                gusset: { type: Type.BOOLEAN },
                flangeDiameter: { type: Type.NUMBER },
                flangeThickness: { type: Type.NUMBER },
                grooveDepth: { type: Type.NUMBER },
                grooveWidth: { type: Type.NUMBER },
                pinCount: { type: Type.NUMBER },
                rows: { type: Type.NUMBER },
                wireDiameter: { type: Type.NUMBER },
                latchClip: { type: Type.BOOLEAN },
              },
            },
          },
          required: ['partType', 'partName', 'rationale', 'filamentMaterial', 'toleranceOffset', 'params'],
        },
      },
    });

    const text = response.text || '{}';
    const jsonResult = JSON.parse(text);
    res.json(jsonResult);
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate vehicle part preset.' });
  }
});

// AI Visual Part Scanning Endpoint (Multimodal Image Analysis)
app.post('/api/ai/preset-from-image', async (req, res) => {
  try {
    const { imageBase64, mimeType, userNotes, vehicleInfo } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required.' });
    }

    const ai = getGenAI();

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Visually inspect this photo of a vehicle replacement part or broken automotive component.
User notes: ${userNotes || 'No extra notes provided.'}
Context Vehicle: ${JSON.stringify(vehicleInfo || {})}

Identify the part type, visually estimate its dimensions in millimeters, choose the optimum 3D printing filament material, and return full CAD parameters.`,
    };

    const systemInstruction = `You are AutoPart 3D Visual Inspection Engineer. Analyze the uploaded photo of an automotive replacement part.
Match the photo to one of these 8 parametric CAD generator part types:

1. "bolt": Hex/Socket Bolt (headType, diameter, pitch, shaftLength, headHeight, headWidth, washerFace)
2. "hoseBarb": Hose Adapter (innerDiameter, outerDiameter, length, barbCount, barbDepth, wallThickness, hexGrip)
3. "gasket": Flange Sealing Gasket (innerDiameter, outerDiameter, thickness, boltHoleDiameter, boltHoles, pcd)
4. "knob": Dash Knob / Switch Button (diameter, height, shaftDiameter, shaftType: "d-shaft"|"round"|"knurled", gripRibs, indicatorDot)
5. "bracket": L-Bracket (length, width, height, thickness, holeDiameter, holeSpacing, gusset)
6. "bushing": Spacer / Bushing (innerDiameter, outerDiameter, length, flangeDiameter, flangeThickness)
7. "oring": O-Ring Seal / Washer (innerDiameter, outerDiameter, thickness, grooveDepth, grooveWidth)
8. "connector": Wiring Harness Connector Shell (pinCount, rows, length, wireDiameter, latchClip)

Filament Material choices: "petg", "asa", "abs", "tpu", "nylon", "cfpc".
Tolerance Offset: recommended fit tolerance (+0.05 to +0.30 mm).

Return JSON ONLY matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            partType: { type: Type.STRING },
            partName: { type: Type.STRING },
            rationale: { type: Type.STRING },
            filamentMaterial: { type: Type.STRING },
            toleranceOffset: { type: Type.NUMBER },
            params: {
              type: Type.OBJECT,
              properties: {
                headType: { type: Type.STRING },
                diameter: { type: Type.NUMBER },
                pitch: { type: Type.NUMBER },
                shaftLength: { type: Type.NUMBER },
                headHeight: { type: Type.NUMBER },
                headWidth: { type: Type.NUMBER },
                washerFace: { type: Type.BOOLEAN },
                innerDiameter: { type: Type.NUMBER },
                outerDiameter: { type: Type.NUMBER },
                length: { type: Type.NUMBER },
                barbCount: { type: Type.NUMBER },
                barbDepth: { type: Type.NUMBER },
                wallThickness: { type: Type.NUMBER },
                hexGrip: { type: Type.BOOLEAN },
                thickness: { type: Type.NUMBER },
                boltHoleDiameter: { type: Type.NUMBER },
                boltHoles: { type: Type.NUMBER },
                pcd: { type: Type.NUMBER },
                height: { type: Type.NUMBER },
                shaftDiameter: { type: Type.NUMBER },
                shaftType: { type: Type.STRING },
                gripRibs: { type: Type.NUMBER },
                indicatorDot: { type: Type.BOOLEAN },
                width: { type: Type.NUMBER },
                holeDiameter: { type: Type.NUMBER },
                holeSpacing: { type: Type.NUMBER },
                gusset: { type: Type.BOOLEAN },
                flangeDiameter: { type: Type.NUMBER },
                flangeThickness: { type: Type.NUMBER },
                grooveDepth: { type: Type.NUMBER },
                grooveWidth: { type: Type.NUMBER },
                pinCount: { type: Type.NUMBER },
                rows: { type: Type.NUMBER },
                wireDiameter: { type: Type.NUMBER },
                latchClip: { type: Type.BOOLEAN },
              },
            },
          },
          required: ['partType', 'partName', 'rationale', 'filamentMaterial', 'toleranceOffset', 'params'],
        },
      },
    });

    const text = response.text || '{}';
    const jsonResult = JSON.parse(text);
    res.json(jsonResult);
  } catch (err: any) {
    console.error('Gemini Image Inspection API Error:', err);
    res.status(500).json({ error: err.message || 'Failed to visually analyze part photo.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoPart 3D Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
