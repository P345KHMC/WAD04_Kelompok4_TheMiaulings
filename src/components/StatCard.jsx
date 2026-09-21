function StatCard({ label, nilai, catatan }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-nilai">{nilai}</p>
      <p className="stat-catatan">{catatan}</p>
    </div>
  );
}

export default StatCard;
