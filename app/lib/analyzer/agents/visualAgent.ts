import { execFile } from 'child_process';
import path from 'path';

export interface VisualAgentResult {
  success: boolean;
  score: number;
  sharpness: number;
  brightness: number;
  contrast: number;
  artifacts: number;
  wcag_ratio: number;
  white_clip_pct: number;
  black_clip_pct: number;
  issues: string[];
  color?: {
    colorPalette: string[];
    dominantHue: number;
    harmonyType: "analogous" | "complementary" | "discordant";
    warmth: number;
    contrastScore: number;
  };
  error?: string;
}

/**
 * Visual Agent
 * Spawns a Python process to run OpenCV algorithms for precise image quality metrics.
 * 
 * @param absoluteImagePath Absolute path to the image file on disk
 * @returns VisualAgentResult containing the computer vision metrics
 */
export async function runVisualAgent(absoluteImagePath: string): Promise<VisualAgentResult> {
  return new Promise((resolve) => {
    // Determine the path to the python script
    // Note: In a real production deployment on Vercel/etc., running child processes
    // or shipping python binaries requires custom build configurations.
    const pythonScriptPath = path.join(process.cwd(), 'python_backend', 'visual_agent.py');
    const pythonExecutable = path.join(process.cwd(), 'python_backend', 'venv', 'Scripts', 'python.exe');

    execFile(pythonExecutable, [pythonScriptPath, absoluteImagePath], (error, stdout, stderr) => {
      if (error) {
        console.error("[Visual Agent] OpenCV Execution Error:", error);
        console.error("[Visual Agent] Stderr:", stderr);
        return resolve({
          success: false,
          score: 0,
          sharpness: 0,
          brightness: 0,
          contrast: 0,
          artifacts: 0,
          wcag_ratio: 0,
          white_clip_pct: 0,
          black_clip_pct: 0,
          issues: ["Failed to run OpenCV visual agent."],
          error: error.message
        });
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve(result as VisualAgentResult);
      } catch (parseError) {
        console.error("[Visual Agent] JSON Parse Error:", parseError, "Stdout:", stdout);
        resolve({
          success: false,
          score: 0,
          sharpness: 0,
          brightness: 0,
          contrast: 0,
          artifacts: 0,
          wcag_ratio: 0,
          white_clip_pct: 0,
          black_clip_pct: 0,
          issues: ["Failed to parse OpenCV visual agent output."],
          error: String(parseError)
        });
      }
    });
  });
}
