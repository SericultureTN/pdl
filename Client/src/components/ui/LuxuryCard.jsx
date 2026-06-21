export default function LuxuryCard({ title, icon, children, className = '', fullWidth = false }) {
  return (
    <div className={`luxury-card ${fullWidth ? 'full-width' : ''} ${className}`}>
      {title && (
        <div className="luxury-card-header">
          <h3>
            {icon}
            {title}
          </h3>
        </div>
      )}
      <div className="luxury-card-content">{children}</div>
    </div>
  );
}
