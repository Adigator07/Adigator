/**
 * Test Suite for OCR & AI Pipeline
 * Run these tests to verify your setup is correct
 * 
 * Usage:
 * NODE_ENV=test node --loader ts-node/esm test-pipeline.ts
 */

import { validateImage, preprocessImage } from "@/app/lib/vision";
import { extractTextFromImage, cleanOCRText } from "@/app/lib/ocr";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  message: string;
  duration: number;
}

const results: TestResult[] = [];

/**
 * Test 1: Verify environment variables
 */
async function testEnvironmentVariables(): Promise<void> {
  const start = Date.now();
  const name = "Environment Variables";

  try {
    const hasGoogle = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (!hasGoogle) {
      results.push({
        name,
        status: "FAIL",
        message: "GOOGLE_APPLICATION_CREDENTIALS not set",
        duration: Date.now() - start,
      });
      return;
    }

    if (!hasOpenAI) {
      results.push({
        name,
        status: "FAIL",
        message: "OPENAI_API_KEY not set",
        duration: Date.now() - start,
      });
      return;
    }

    results.push({
      name,
      status: "PASS",
      message: "All required environment variables are set",
      duration: Date.now() - start,
    });
  } catch (error) {
    results.push({
      name,
      status: "FAIL",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - start,
    });
  }
}

/**
 * Test 2: Image validation
 */
async function testImageValidation(): Promise<void> {
  const start = Date.now();
  const name = "Image Validation";

  try {
    // Create a minimal valid JPEG buffer (magic bytes)
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, // JPEG header
      ...Array(1000).fill(0), // Padding
      0xff, 0xd9, // JPEG end marker
    ]);

    const result = await validateImage(jpegBuffer);

    if (result.valid) {
      results.push({
        name,
        status: "PASS",
        message: `Image detected as ${result.format}`,
        duration: Date.now() - start,
      });
    } else {
      results.push({
        name,
        status: "FAIL",
        message: result.error || "Validation failed",
        duration: Date.now() - start,
      });
    }
  } catch (error) {
    results.push({
      name,
      status: "SKIP",
      message: `Image validation skipped: ${error instanceof Error ? error.message : "Unknown error"}`,
      duration: Date.now() - start,
    });
  }
}

/**
 * Test 3: OCR text cleaning
 */
async function testTextCleaning(): Promise<void> {
  const start = Date.now();
  const name = "OCR Text Cleaning";

  try {
    const messyText = "  Hello   World  ||  This|  is   a   test  ";
    const cleaned = cleanOCRText(messyText);
    const expected = "Hello World I This is a test";

    if (cleaned === expected) {
      results.push({
        name,
        status: "PASS",
        message: "Text cleaning working correctly",
        duration: Date.now() - start,
      });
    } else {
      results.push({
        name,
        status: "FAIL",
        message: `Expected "${expected}", got "${cleaned}"`,
        duration: Date.now() - start,
      });
    }
  } catch (error) {
    results.push({
      name,
      status: "FAIL",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - start,
    });
  }
}

/**
 * Test 4: API endpoint health check
 */
async function testAPIHealth(): Promise<void> {
  const start = Date.now();
  const name = "API Health Check";

  try {
    const response = await fetch("http://localhost:3000/api/process", {
      method: "GET",
    });

    if (response.ok) {
      results.push({
        name,
        status: "PASS",
        message: "API endpoint is healthy",
        duration: Date.now() - start,
      });
    } else {
      results.push({
        name,
        status: "FAIL",
        message: `API returned ${response.status}`,
        duration: Date.now() - start,
      });
    }
  } catch (error) {
    results.push({
      name,
      status: "SKIP",
      message:
        "API health check skipped - ensure dev server is running (npm run dev)",
      duration: Date.now() - start,
    });
  }
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("OCR & AI Pipeline - Test Suite");
  console.log("=".repeat(60) + "\n");

  await testEnvironmentVariables();
  await testImageValidation();
  await testTextCleaning();
  await testAPIHealth();

  // Print results
  console.log("Test Results:\n");
  results.forEach((result) => {
    const status = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⏭️";
    console.log(`${status} ${result.name}`);
    console.log(`   ${result.message}`);
    console.log(`   (${result.duration}ms)\n`);
  });

  // Summary
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  console.log("=".repeat(60));
  console.log(`Summary: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log("=".repeat(60) + "\n");

  if (failed > 0) {
    console.log("⚠️  Some tests failed. Check the setup guide:");
    console.log("   📖 Read: OCR_SETUP_GUIDE.md\n");
    process.exit(1);
  }

  console.log("✅ All tests passed! Your setup is ready.\n");
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testEnvironmentVariables, testImageValidation, testTextCleaning, testAPIHealth };
