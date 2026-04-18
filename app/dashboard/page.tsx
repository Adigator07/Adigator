import DashboardCards from "../components/dashboardcards";

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Dashboard
        </h1>
        <p className="text-white/60" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Welcome back! Here's an overview of your ad performance.
        </p>
      </div>

      <DashboardCards />
    </div>
  );
}