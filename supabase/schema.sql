-- =============================================================================
-- PASHU PULSE - Supabase PostgreSQL Database Schema (v1.0)
-- Livestock Healthcare, Multilingual Advisory & Early Warning System
-- Target: Supabase PostgreSQL (Supports Row Level Security & Realtime)
-- =============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table (Farmers, Veterinarians, Admins)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'farmer' NOT NULL CHECK (role IN ('farmer', 'veterinarian', 'admin')),
    language_pref VARCHAR(10) DEFAULT 'kn' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Animals Table (Cattle, Buffalo, etc.)
CREATE TABLE IF NOT EXISTS animals (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag_id VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    species VARCHAR(30) NOT NULL,
    breed VARCHAR(100),
    gender VARCHAR(10) NOT NULL,
    age_months INT,
    photo_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'archived', 'sold', 'deceased')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    server_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_animals_user_id ON animals(user_id);
CREATE INDEX IF NOT EXISTS idx_animals_tag_id ON animals(tag_id);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);

-- 4. Health Events Table
CREATE TABLE IF NOT EXISTS health_events (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    animal_id VARCHAR(36) NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    title VARCHAR(150) NOT NULL,
    notes TEXT,
    medicine_name VARCHAR(100),
    dosage VARCHAR(50),
    vet_name VARCHAR(100),
    cost NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    server_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_health_events_animal_id ON health_events(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_events_event_type ON health_events(event_type);

-- 5. Veterinarians Table
CREATE TABLE IF NOT EXISTS vets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    district VARCHAR(50) NOT NULL,
    sub_district VARCHAR(50) DEFAULT '',
    specialization VARCHAR(150) NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vets_district ON vets(district);

-- 6. Cases Table (End-to-End Clinical Journey & AI Preliminary Triage)
CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    case_number VARCHAR(30) UNIQUE NOT NULL,
    animal_id VARCHAR(36) NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    farmer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vet_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'AWAITING_VETERINARIAN' NOT NULL,
    symptoms JSONB DEFAULT '[]'::jsonb NOT NULL,
    description TEXT,
    duration_days INT DEFAULT 1 NOT NULL,
    temperature_f NUMERIC(5, 2),
    appetite VARCHAR(30) DEFAULT 'reduced',
    photo_url TEXT,
    location_name VARCHAR(100) DEFAULT 'Mandya, Karnataka',
    latitude NUMERIC(10, 6) DEFAULT 12.5238,
    longitude NUMERIC(10, 6) DEFAULT 76.8973,
    language VARCHAR(10) DEFAULT 'kn',
    ai_risk_level VARCHAR(20) DEFAULT 'MODERATE',
    ai_urgency VARCHAR(20) DEFAULT 'NORMAL',
    ai_preliminary_indicators JSONB DEFAULT '[]'::jsonb,
    ai_recommendations JSONB DEFAULT '[]'::jsonb,
    ai_disclaimer TEXT,
    doctor_notes TEXT,
    prescription JSONB,
    treatment_start_date TIMESTAMPTZ,
    treatment_end_date TIMESTAMPTZ,
    confirmed_doses JSONB DEFAULT '[]'::jsonb,
    followup_date TIMESTAMPTZ,
    recovery_status VARCHAR(30),
    is_closed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cases_animal_id ON cases(animal_id);
CREATE INDEX IF NOT EXISTS idx_cases_farmer_id ON cases(farmer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);

-- 7. SOS Emergency Requests Table
CREATE TABLE IF NOT EXISTS sos_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    animal_id VARCHAR(36) NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    farmer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) DEFAULT 'ACUTE_EMERGENCY' NOT NULL,
    notes TEXT,
    location_name VARCHAR(100) DEFAULT 'Mandya, Karnataka',
    latitude NUMERIC(10, 6) DEFAULT 12.5238,
    longitude NUMERIC(10, 6) DEFAULT 76.8973,
    status VARCHAR(20) DEFAULT 'DISPATCHED' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sos_animal_id ON sos_requests(animal_id);
CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_requests(status);

-- 8. Village Outbreak Radar Clusters Table
CREATE TABLE IF NOT EXISTS village_clusters (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    village_name VARCHAR(100) NOT NULL,
    taluk VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    disease_name VARCHAR(100) NOT NULL,
    disease_name_kn VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    suspected_cases INT DEFAULT 0,
    confirmed_cases INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'SUSPECTED' NOT NULL,
    is_synthetic_demo BOOLEAN DEFAULT TRUE NOT NULL,
    advisory_kn TEXT NOT NULL,
    advisory_en TEXT NOT NULL,
    audio_broadcast_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clusters_taluk ON village_clusters(taluk);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON village_clusters(status);

-- 9. Family Caregivers Table
CREATE TABLE IF NOT EXISTS family_members (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    animal_id VARCHAR(36) NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    role VARCHAR(30) DEFAULT 'CAREGIVER' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Activity Audit Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    animal_id VARCHAR(36) NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_animal_id ON activity_logs(animal_id);

-- 11. Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    animal_id VARCHAR(36) NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    reminder_type VARCHAR(30) NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Symptom Decision Tree Rules Table
CREATE TABLE IF NOT EXISTS symptom_rules (
    id VARCHAR(50) PRIMARY KEY,
    species VARCHAR(30) NOT NULL,
    symptom_key VARCHAR(50) NOT NULL,
    title_en VARCHAR(150) NOT NULL,
    title_kn VARCHAR(150) NOT NULL,
    decision_tree JSONB NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- SEED DATA FOR MANDYA & MYSURU REGION (Vets & Early Warning Outbreak Radar)
-- =============================================================================
INSERT INTO vets (name, role, phone, district, sub_district, specialization, is_verified)
VALUES
('Dr. Ramesh Kumar M.', 'Senior Veterinary Officer (Govt)', '+91 98450 12345', 'Mandya', 'Mandya Central Polyclinic', 'Bovine Infectious Diseases, Herd Health & Obstetrics', true),
('Dr. Basavaraju Gowda', 'Veterinary Surgeon', '+91 98451 23456', 'Mysuru', 'Nanjangud Taluk Polyclinic', 'Cattle & Buffalo Internal Medicine, Foot Lesions', true),
('Dr. Anitha K. Swamy', 'Assistant Director, Animal Husbandry', '+91 98452 34567', 'Mandya', 'Pandavapura', 'Epidemiology, Viral Outbreaks & Biosecurity', true),
('Smt. Lakshmi Devi', 'Pashu Sakhi / Paravet', '+91 98453 45678', 'Mandya', 'Srirangapatna', 'First Aid, Deworming, Vaccinations & Caregiver Support', true),
('Dr. Chamaraja Urs', 'Private Veterinary Practitioner', '+91 98454 56789', 'Mysuru', 'Hunsur', 'Dairy Cattle Nutrition, Metabolic Diseases', true)
ON CONFLICT DO NOTHING;

INSERT INTO village_clusters (id, village_name, taluk, district, disease_name, disease_name_kn, latitude, longitude, suspected_cases, confirmed_cases, status, is_synthetic_demo, advisory_kn, advisory_en)
VALUES
('cluster-1', 'Pandavapura East', 'Pandavapura', 'Mandya', 'Foot and Mouth Disease (FMD)', 'ಕಾಲುಬಾಯಿ ರೋಗ (FMD)', 12.4984, 76.6712, 14, 3, 'UNDER_VERIFICATION', true, 'ಎಚ್ಚರಿಕೆ: ಬಾಯಿ ಅಥವಾ ಪಾದದಲ್ಲಿ ಗುಳ್ಳೆಗಳು ಕಂಡುಬಂದರೆ ತಕ್ಷಣ ಪ್ರತ್ಯೇಕಿಸಿ. ಉಚಿತ ಲಸಿಕೆ ಲಭ್ಯವಿದೆ.', 'Advisory: If mouth or foot lesions appear, isolate cattle immediately. Free ring-vaccination active.'),
('cluster-2', 'Srirangapatna North', 'Srirangapatna', 'Mandya', 'Lumpy Skin Disease (LSD)', 'ಚರ್ಮ ಗಂಟು ರೋಗ (LSD)', 12.4227, 76.6934, 8, 1, 'SUSPECTED', true, 'ಚರ್ಮದ ಮೇಲೆ ಗಂಟುಗಳು ಕಾಣಿಸಿಕೊಂಡರೆ ಕೀಟನಾಶಕ ಹೊಗೆ ಮತ್ತು ನೊಣ ನಿಯಂತ್ರಣ ಕ್ರಮಗಳನ್ನು ಕೈಗೊಳ್ಳಿ.', 'Mosquito & vector repellent spraying recommended. Monitor for fever and cutaneous nodules.'),
('cluster-3', 'Nanjangud Rural', 'Nanjangud', 'Mysuru', 'Haemorrhagic Septicaemia (HS)', 'ಗಳಗಂಡ ರೋಗ (HS)', 12.1197, 76.6792, 2, 0, 'SUSPECTED', true, 'ಗಳಗಂಡ ಶಂಕೆ: ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಉಸಿರಾಟದ ತೊಂದರೆ ಕಂಡರೆ ವೈದ್ಯರನ್ನು ತಕ್ಷಣ ಸಂಪರ್ಕಿಸಿ.', 'Suspected HS: Contact taluk polyclinic immediately if acute respiratory distress occurs.'),
('cluster-4', 'Maddur Dairy Belt', 'Maddur', 'Mandya', 'Bovine Mastitis Pattern', 'ಕೆಚ್ಚಲು ಬಾವು ರೋಗ', 12.5841, 77.0453, 19, 9, 'CONFIRMED', true, 'ಹಾಲು ಹಿಂಡುವ ಮುನ್ನ ಮತ್ತು ನಂತರ ಸ್ವಚ್ಛತಾ ಕ್ರಮಗಳನ್ನು ಕಡ್ಡಾಯವಾಗಿ ಪಾಲಿಸಿ.', 'Confirmed Mastitis cluster. Strict teat-dipping and milking hygiene protocol enforced.')
ON CONFLICT (id) DO UPDATE SET
  suspected_cases = EXCLUDED.suspected_cases,
  confirmed_cases = EXCLUDED.confirmed_cases,
  status = EXCLUDED.status;
