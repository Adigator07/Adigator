import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });
    }

    const tempDir = os.tmpdir();
    const imagePath = path.join(tempDir, `preprocess_${Date.now()}.png`);
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    await writeFile(imagePath, Buffer.from(base64Data, 'base64'));

    const pythonScript = path.join(process.cwd(), "python_backend", "ocr_preprocess.py");
    const pythonExec = path.join(process.cwd(), "python_backend", "venv", "Scripts", "python.exe");

    // Fallback to global python if venv doesn't exist (handled by python execution)
    const cmd = `"${pythonExec}" "${pythonScript}" "${imagePath}"`;
    const fallbackCmd = `python "${pythonScript}" "${imagePath}"`;

    let stdout, stderr;
    try {
      ({ stdout, stderr } = await execAsync(cmd));
    } catch (err) {
      ({ stdout, stderr } = await execAsync(fallbackCmd));
    }

    const result = JSON.parse(stdout);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      image: result.image
    });

  } catch (error: any) {
    console.error("[API/Preprocess] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
