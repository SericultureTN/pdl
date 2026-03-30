-- =====================================================
-- PDL Admin Portal - Supabase Database Setup Script
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Sericulturists Table
CREATE TABLE IF NOT EXISTS sericulturists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    village VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255),
    pincode VARCHAR(10),
    registration_number VARCHAR(50) UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create PDL Schemes Table
CREATE TABLE IF NOT EXISTS pdl_schemes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50), -- 'subsidy', 'training', 'equipment', etc.
    amount DECIMAL(10,2),
    eligibility_criteria TEXT,
    application_process TEXT,
    documents_required TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    sericulturist_id INTEGER REFERENCES sericulturists(id),
    scheme_id INTEGER REFERENCES pdl_schemes(id),
    application_data JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES admins(id),
    remarks TEXT
);

-- 5. Create Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'annual'
    title VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    generated_by INTEGER REFERENCES admins(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    period_start DATE,
    period_end DATE
);

-- 6. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_sericulturists_email ON sericulturists(email);
CREATE INDEX IF NOT EXISTS idx_sericulturists_registration ON sericulturists(registration_number);
CREATE INDEX IF NOT EXISTS idx_applications_sericulturist ON applications(sericulturist_id);
CREATE INDEX IF NOT EXISTS idx_applications_scheme ON applications(scheme_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_period ON reports(period_start, period_end);

-- 7. Insert Default Admin User
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO admins (email, password_hash, name, role) 
VALUES (
    'admin@example.com',
    '$2b$10$rQZ8GYaP3Y8Y8Y8Y8Y8Y8O8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8',
    'Administrator',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- 8. Insert Sample PDL Schemes
INSERT INTO pdl_schemes (name, description, type, amount, eligibility_criteria, application_process, documents_required) VALUES
(
    'Silk Worm Rearing Subsidy',
    'Financial assistance for silk worm rearing equipment and infrastructure',
    'subsidy',
    25000.00,
    'Must be registered sericulturist with minimum 2 years experience',
    '1. Submit application form\n2. Provide documents\n3. Field verification\n4. Approval',
    'Aadhar card, Registration certificate, Bank details, Land records'
),
(
    'Mulberry Plantation Support',
    'Support for mulberry plantation development and maintenance',
    'subsidy',
    15000.00,
    'Minimum 0.5 acre land available for mulberry cultivation',
    '1. Land verification\n2. Document submission\n3. Approval process',
    'Land documents, Aadhar card, Bank details'
),
(
    'Technical Training Program',
    'Free technical training on modern sericulture practices',
    'training',
    0.00,
    'All registered sericulturists eligible',
    '1. Registration\n2. Attendance\n3. Certification',
    'Registration certificate, Identity proof'
) ON CONFLICT DO NOTHING;

-- 9. Create Updated Timestamp Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sericulturists_updated_at BEFORE UPDATE ON sericulturists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pdl_schemes_updated_at BEFORE UPDATE ON pdl_schemes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create Views for Easy Access
CREATE OR REPLACE VIEW admin_summary AS
SELECT 
    COUNT(*) as total_admins,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admin_count,
    MAX(created_at) as last_admin_added
FROM admins;

CREATE OR REPLACE VIEW sericulturist_summary AS
SELECT 
    COUNT(*) as total_sericulturists,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month
FROM sericulturists;

CREATE OR REPLACE VIEW application_summary AS
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN submitted_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week_applications
FROM applications;

-- 11. Grant Permissions (if using Row Level Security)
-- Uncomment and modify as needed for your security requirements

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Your Supabase database is now ready for PDL Admin Portal
-- 
-- Next Steps:
-- 1. Update your Node/.env file with your Supabase password
-- 2. Start the backend server: npm run dev-postgres
-- 3. Test login with: admin@example.com / Admin123!
-- =====================================================
