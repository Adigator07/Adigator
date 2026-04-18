"use client";

import { useState } from "react";

export default function Intelligence() {
  const [file, setFile] = useState<any>(null);
  const [result, setResult] = useState<string | null>(null);

  const analyze = () => {
    if (!file) {
      alert("Upload file first");
      return;
    }

    setResult("Good color contrast. Improve CTA visibility.");
  };

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Intelligence Check 🧠</h1>

      <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />

      <br /><br />

      <button onClick={analyze}>Analyze</button>

      <br /><br />

      {result && (
        <div>
          <h3>Insights:</h3>
          <p>{result}</p>
        </div>
      )}
    </main>
  );
}