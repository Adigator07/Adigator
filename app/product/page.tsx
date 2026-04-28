"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const steps = [
	{
		title: "Step 1 - Setup Campaign",
		description: "Select platform, campaign goal, and audience.",
	},
	{
		title: "Step 2 - Upload Creatives",
		description: "Validate formats, sizes, and fix issues.",
	},
	{
		title: "Step 3 - Analyze Performance",
		description: "Get insights on visibility, CTA strength, and device compatibility.",
	},
	{
		title: "Step 4 - Preview Ads",
		description: "See creatives inside real website environments.",
	},
	{
		title: "Step 5 - Export Results",
		description: "Download PPT/PDF for client presentation.",
	},
];

const features = [
	"IAB Banner Size Validation",
	"Mobile & Desktop Optimization",
	"Real Website Preview",
	"Creative Comparison",
	"Smart Recommendations",
	"PPT / PDF Export",
];

const outcomes = [
	"Reduce wasted ad spend",
	"Improve campaign performance",
	"Save time for teams",
	"Make confident decisions",
];

export default function ProductPage() {
	return (
		<main className="relative min-h-screen bg-[#020617] text-white">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 left-[-200px] h-[520px] w-[520px] rounded-full bg-purple-500/20 blur-[70px] md:blur-[150px]" />
				<div className="absolute right-[-140px] top-[20%] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[70px] md:blur-[120px]" />
				<div className="absolute bottom-[-180px] left-1/2 hidden h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-pink-500/15 blur-[80px] md:block md:blur-[140px]" />
			</div>

			<header className="relative z-20 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
				<div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
					<Link href="/" className="text-lg font-semibold uppercase tracking-[0.22em]">Adigator</Link>
					<nav className="hidden items-center gap-7 text-sm text-gray-400 md:flex">
						<Link href="/product" className="text-white">Product</Link>
						<Link href="/about" className="transition hover:text-white">About</Link>
						<Link href="/login" className="transition hover:text-white">Login</Link>
					</nav>
				</div>
			</header>

			<section className="relative z-10 px-6 py-24 md:px-10">
				<div className="mx-auto max-w-6xl">
					<motion.h1
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, ease: "easeOut" }}
						className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl"
					>
						Preview and validate your ads before they go live
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
						className="mt-6 max-w-3xl text-base leading-relaxed text-gray-400 md:text-lg"
					>
						Adigator helps you upload, analyze, and preview display creatives across Google Ads and programmatic platforms before spending your budget.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
						className="mt-10"
					>
						<Link
							href="/preview-tool"
							className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 sm:w-auto"
						>
							Start Free Preview
						</Link>
					</motion.div>
				</div>
			</section>

			<section className="relative z-10 px-6 py-20 md:px-10">
				<div className="mx-auto max-w-6xl">
					<h2 className="text-3xl font-semibold md:text-4xl">How it works</h2>
					<div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
						{steps.map((step, index) => (
							<motion.div
								key={step.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, amount: 0.3 }}
								transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
								className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
							>
								<p className="text-xs uppercase tracking-[0.12em] text-gray-500">{step.title}</p>
								<p className="mt-3 text-sm leading-relaxed text-gray-400">{step.description}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="relative z-10 px-6 py-20 md:px-10">
				<div className="mx-auto max-w-6xl">
					<h2 className="text-3xl font-semibold md:text-4xl">Features built for campaign teams</h2>
					<div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{features.map((feature, index) => (
							<motion.div
								key={feature}
								initial={{ opacity: 0, y: 18 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, amount: 0.35 }}
								transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
								className="rounded-2xl border border-white/10 bg-[#0b1224]/80 p-5 text-sm text-gray-300 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
							>
								{feature}
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="relative z-10 px-6 py-20 md:px-10">
				<div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:p-8">
					<h2 className="text-3xl font-semibold md:text-4xl">See your ads before your audience does</h2>
					<div className="mt-8 grid gap-6 lg:grid-cols-2">
						<div className="rounded-2xl border border-white/10 bg-[#0b1224]/80 p-4">
							<div className="flex h-[250px] items-center justify-center rounded-xl border border-dashed border-white/20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 text-sm text-gray-400">
								Preview tool screenshot placeholder
							</div>
						</div>
						<div className="rounded-2xl border border-white/10 bg-[#0b1224]/80 p-4">
							<div className="flex h-[250px] items-center justify-center rounded-xl border border-dashed border-white/20 bg-gradient-to-br from-pink-500/10 to-purple-500/10 text-sm text-gray-400">
								Analysis UI placeholder
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="relative z-10 px-6 py-20 md:px-10">
				<div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:p-8">
					<h2 className="text-3xl font-semibold md:text-4xl">Why it matters</h2>
					<p className="mt-5 max-w-3xl text-base leading-relaxed text-gray-400 md:text-lg">
						Most campaigns fail due to weak creatives before launch.
					</p>

					<div className="mt-8 grid gap-4 sm:grid-cols-2">
						{outcomes.map((item, index) => (
							<motion.div
								key={item}
								initial={{ opacity: 0, x: -16 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true, amount: 0.35 }}
								transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
								className="rounded-xl border border-white/10 bg-[#0b1224]/80 px-5 py-4 text-sm text-gray-300"
							>
								{item}
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="relative z-10 border-y border-white/10 px-6 py-24 text-center md:px-10">
				<div className="mx-auto max-w-6xl">
					<h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
						Your next campaign deserves a smarter start
					</h2>
					<Link
						href="/preview-tool"
						className="mt-10 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 sm:w-auto"
					>
						Start Free Preview
					</Link>
				</div>
			</section>
		</main>
	);
}
