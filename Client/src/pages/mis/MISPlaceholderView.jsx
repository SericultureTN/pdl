export default function MISPlaceholderView({ title, description }) {
  return (
    <div className="dfls-distribution-view">
      <div className="dfls-office-card">
        <div className="dfls-office-card-top">
          <h2>{title}</h2>
        </div>
        <p className="mis-placeholder-text">
          {description || 'This screen is under development. Data entry will be available soon.'}
        </p>
      </div>
    </div>
  );
}
