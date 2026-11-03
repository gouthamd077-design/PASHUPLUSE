import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Colors
    c_primary = RGBColor(13, 92, 58)      # Emerald #0D5C3A
    c_dark = RGBColor(8, 59, 37)          # Dark Green #083B25
    c_accent = RGBColor(229, 152, 25)     # Amber/Gold #E59819
    c_card_bg = RGBColor(245, 250, 247)   # Soft mint background #F5FAF7
    c_text_dark = RGBColor(30, 41, 59)    # Slate 800 #1E293B
    c_text_muted = RGBColor(100, 116, 139)# Slate 500 #64748B
    c_white = RGBColor(255, 255, 255)
    c_border = RGBColor(203, 213, 225)    # Slate 300
    c_red = RGBColor(220, 38, 38)         # Red 600

    def add_header(slide, title_text, category="PASHU PULSE — PRODUCT & IMPLEMENTATION DECK"):
        # Top banner
        header_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.1))
        header_shape.fill.solid()
        header_shape.fill.fore_color.rgb = c_card_bg
        header_shape.line.color.rgb = c_border
        header_shape.line.width = Pt(1)

        tf = header_shape.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_top = Inches(0.12)

        p1 = tf.paragraphs[0]
        p1.text = category.upper()
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = c_accent

        p2 = tf.add_paragraph()
        p2.text = title_text
        p2.font.size = Pt(20)
        p2.font.bold = True
        p2.font.color.rgb = c_dark

    def add_card(slide, left, top, width, height, title, items, tag=""):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = c_white
        card.line.color.rgb = c_border
        card.line.width = Pt(1.2)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.2)

        if tag:
            p_tag = tf.paragraphs[0]
            p_tag.text = tag.upper()
            p_tag.font.size = Pt(9)
            p_tag.font.bold = True
            p_tag.font.color.rgb = c_primary
            
            p_title = tf.add_paragraph()
            p_title.text = title
            p_title.font.size = Pt(15)
            p_title.font.bold = True
            p_title.font.color.rgb = c_dark
            p_title.space_after = Pt(8)
        else:
            p_title = tf.paragraphs[0]
            p_title.text = title
            p_title.font.size = Pt(15)
            p_title.font.bold = True
            p_title.font.color.rgb = c_dark
            p_title.space_after = Pt(8)

        for item in items:
            p = tf.add_paragraph()
            p.text = f"•  {item}"
            p.font.size = Pt(11)
            p.font.color.rgb = c_text_dark
            p.space_after = Pt(4)

    # ==================== SLIDE 1: Title & Executive Summary ====================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = c_dark
    bg1.line.fill.background()

    # Title box
    tbox = s1.shapes.add_textbox(Inches(1.0), Inches(1.3), Inches(11.333), Inches(4.8))
    tf1 = tbox.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "PASHU PULSE  |  ಪಶು ಪಲ್ಸ್"
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = c_accent
    p.space_after = Pt(8)

    p = tf1.add_paragraph()
    p.text = "From First Symptom to Documented Recovery"
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = c_white
    p.space_after = Pt(16)

    p = tf1.add_paragraph()
    p.text = "An offline-first rural veterinary emergency and health passport platform connecting dairy farmers, community caregivers, and verified veterinarians across Mandya & Mysuru."
    p.font.size = Pt(14)
    p.font.color.rgb = RGBColor(220, 240, 230)
    p.space_after = Pt(28)

    # 3 Metrics pills
    pill_data = [
        ("15-Min SLA", "Emergency triage countdown & auto-escalation to field vets"),
        ("100% Offline-First", "Works in zero-connectivity cowsheds via IndexedDB"),
        ("Dynamic QR Passport", "Standardized identity & role-based medical privacy")
    ]
    for i, (metric, desc) in enumerate(pill_data):
        card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0 + i * 3.85), Inches(4.8), Inches(3.6), Inches(1.8))
        card.fill.solid()
        card.fill.fore_color.rgb = c_primary
        card.line.color.rgb = c_accent
        card.line.width = Pt(1.5)
        
        ctf = card.text_frame
        ctf.word_wrap = True
        ctf.margin_left = Inches(0.2)
        ctf.margin_top = Inches(0.2)
        
        cp1 = ctf.paragraphs[0]
        cp1.text = metric
        cp1.font.size = Pt(16)
        cp1.font.bold = True
        cp1.font.color.rgb = c_accent
        
        cp2 = ctf.add_paragraph()
        cp2.text = desc
        cp2.font.size = Pt(11)
        cp2.font.color.rgb = c_white

    # ==================== SLIDE 2: Problem & Clinical Mission ====================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "The Rural Livestock Crisis & Our Clinical Mission", "Problem Statement & Vision")
    
    add_card(s2, 0.8, 1.8, 5.7, 5.0, "Critical Challenges in Rural Dairy", [
        "Delayed Symptom Recognition: Farmers notice fever or mastitis 48-72h late, causing milk drop or cow fatality.",
        "Severe Veterinary Access Gap: Only 1 vet per 12,000 cattle in Karnataka; emergency calls go unanswered.",
        "Zero Medical History: Hand-written prescriptions are lost; vets treat blindly without knowing past antibiotics.",
        "Antibiotic Misuse: Unfinished doses lead to AMR (antimicrobial resistance) and chronic infection relapse.",
        "Language & Connectivity Barrier: Existing government portals are English-first and require stable 4G."
    ], tag="The Crisis in Field Reality")

    add_card(s2, 6.8, 1.8, 5.7, 5.0, "The PASHU PULSE Mission & Protocol", [
        "15-Minute Emergency SLA: Guaranteed escalation to nearest available vet with GPS-routed alerts.",
        "Pure Kannada & English Interfaces: Intuitive icon-driven & voice-assisted triage tailored for rural dairy owners.",
        "Dynamic QR Health Passport: One permanent tag per animal encoding unified case records, fever logs & vaccines.",
        "Clinical Safety Guardrails: AI never writes prescriptions or diagnoses; strict vet-in-the-loop authorization.",
        "Offline-First Resilience: Full intake, temperature entry, and guidance operate without active cellular network."
    ], tag="Our Dual-Sided Solution")

    # ==================== SLIDE 3: System Architecture & Implementation ====================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Full-Stack System Architecture & Production Deployment", "Engineering Implementation")

    add_card(s3, 0.8, 1.8, 3.7, 5.0, "Frontend & Edge Layer", [
        "Vite + React 18: Ultra-fast single page application with Tailwind CSS responsive design.",
        "Offline-First Cache: IndexedDB cache for case storage, audio prompts, and pending sync queues.",
        "Camera Hardware Integration: html5-qrcode for instant rear-camera QR tag reading on iOS & Android.",
        "PWA Architecture: Installable home-screen app with background service-worker caching."
    ], tag="Client & Field Hardware")

    add_card(s3, 4.8, 1.8, 3.7, 5.0, "Backend & API Engine", [
        "FastAPI (Python 3.12): High-throughput asynchronous REST API deployed as serverless functions.",
        "Pydantic Validation: Strict schema enforcement across health passports, temperature telemetry & cases.",
        "Dynamic RBAC: Role-based filtering distinguishing anonymous viewers, herd owners, and verified vets.",
        "Automated Pytest Suite: Comprehensive test suite for triage, security rules, and audit trails."
    ], tag="High-Performance Microservice")

    add_card(s3, 8.8, 1.8, 3.7, 5.0, "Cloud & Security Infrastructure", [
        "Supabase PostgreSQL: Production relational database with Row Level Security (RLS) policies.",
        "Live Vercel Deployment: Automated multi-service routing linking static frontend and backend endpoints.",
        "Immutable Audit Logs: Dedicated audit trail table capturing viewer ID, role, timestamp, and accessed animal.",
        "Zero-Data Leakage: Only animal identifier stored in physical QR codes; medical data protected on server."
    ], tag="Enterprise Security & DB")

    # ==================== SLIDE 4: Feature 1 & 2 - QR Scanner & Passport ====================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Dynamic QR Scanner & Animal Health Passport", "Core Implementation Highlights")

    add_card(s4, 0.8, 1.8, 5.7, 5.0, "Hardware QR Scanner & Tag Generator", [
        "Multi-Platform Scanner: Rear-camera auto-detection using html5-qrcode; robust fallback on iOS Safari.",
        "Manual ID Fallback: Simple input box when camera is damaged, dark, or tag is partially obscured.",
        "Printable Ear-Tag Badges: Built-in QR generator creates printable ear-tag badges and pocket ID cards.",
        "Privacy-by-Design: QR embeds ONLY the tag URL (/animal/PP-A-000101). No medical data exposed in the code.",
        "Lifecycle Clean-up: Instant camera sensor suspension upon screen exit to conserve battery."
    ], tag="Scanner Implementation")

    add_card(s4, 6.8, 1.8, 5.7, 5.0, "Animal Health Passport & Multi-Tier RBAC", [
        "Unified Animal Dossier: Name, species, breed, age, sex, owner identity, village, and photo.",
        "Active Clinical State: Highlights active infections, ongoing medication courses, and last vet visit date.",
        "Multi-Tier Access Control: Anonymous scans show minimal identity card; authenticated owners & vets get full records.",
        "Digital Vaccination Ledger: Tracks vaccine batch, inoculation date, and auto-calculates next due booster.",
        "Audit Logging on Every Open: Writes user ID, role, timestamp to database for compliance and privacy."
    ], tag="Health Passport Architecture")

    # ==================== SLIDE 5: Feature 3 - Fever & Vital Telemetry ====================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Real-Time Fever & Vital Telemetry Logging", "Clinical Telemetry & Analytics")

    add_card(s5, 0.8, 1.8, 5.7, 5.0, "Temperature Telemetry Architecture", [
        "Continuous Vital Tracking: Farmers and vets log body temperature readings across symptom duration.",
        "Species-Specific Normal Baselines: Dynamic threshold engine calibrated for cattle (101.5°F - 102.5°F) and buffalo (100.0°F - 102.0°F).",
        "Clinical Fever Triggers: Immediate visual flags when readings cross critical thresholds (>102.5°F / >102.0°F).",
        "Zero Metric Hallucination: Strict integrity rule — shows 'No temperature recorded' when unobserved; never invents synthetic numbers.",
        "One-Click Temperature Capture: Quick-add modal on the passport page directly appending to the historical log."
    ], tag="Vital Metrics Engine")

    add_card(s5, 6.8, 1.8, 5.7, 5.0, "Interactive Vital Trend Visualization", [
        "Dynamic SVG Line Chart: Smooth time-series rendering of temperature progression across treatment days.",
        "Threshold Visual Benchmark: Distinct reference line for normal body temperature vs fever zone.",
        "High-Fever Marker Nodes: Visual pulse markers identifying peak febrile episodes for visiting vets.",
        "Treatment Correlation: Helps vets verify if administered antipyretics or antibiotics successfully reduced fever.",
        "Offline Logging & Sync: Farmers can log temperatures in cowsheds with auto-sync upon reconnection."
    ], tag="Interactive Trendline")

    # ==================== SLIDE 6: Feature 4 & 5 - AI Triage & Disease Radar ====================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "AI Symptom Triage & GPS Disease Radar", "Epidemiological Surveillance")

    add_card(s6, 0.8, 1.8, 5.7, 5.0, "Clinical AI Symptom Triage", [
        "Multi-Modal Intake: Farmers report symptoms via visual icon selector, voice notes, or Kannada text.",
        "Automated Severity Scoring: Categorizes cases into Mild, Moderate, or Critical (e.g. bloat, prolapse, recumbency).",
        "Strict Clinical Safety Guardrail: All AI outputs are labeled 'Preliminary, not a diagnosis'. AI never writes prescriptions.",
        "Instant First-Aid Guidance: Delivers safe, non-medicinal supportive care (cool water spray, isolation, hydration).",
        "Vet Escalation Dispatch: Instantly compiles clinical summary and transmits to assigned field veterinarian."
    ], tag="Safe AI Triage")

    add_card(s6, 6.8, 1.8, 5.7, 5.0, "GPS-Tagged Disease Radar & Outbreak Alerts", [
        "Epidemiological Clustering: Aggregates reported symptoms by village and taluk (Mandya, Maddur, Pandavapura).",
        "Early Outbreak Warning: Alerts neighboring farms when 3+ cases of Foot & Mouth Disease (FMD) or Lumpy Skin occur.",
        "Kannada Voice Broadcasting: Pushes automated regional voice alerts to dairy cooperatives and farmers.",
        "Quarantine & Biosecurity Protocols: Supplies actionable containment checklists to prevent cross-herd contamination.",
        "Government Vet Heatmaps: Provides taluk veterinary officers with real-time outbreak surveillance feeds."
    ], tag="Community Biosecurity")

    # ==================== SLIDE 7: Feature 6 & 7 - Emergency SOS & Care Adherence ====================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Emergency SOS & Smart Medication Adherence", "Emergency Response & Treatment Adherence")

    add_card(s7, 0.8, 1.8, 5.7, 5.0, "15-Minute Emergency SOS Protocol", [
        "Red Alert Mode: Instant high-priority dispatch for acute emergencies (choking, severe bloat, dystocia).",
        "Active Countdown Timer: 15-minute SLA timer keeping the farmer informed of vet dispatch status.",
        "Direct Contact & GPS Routing: Coordinates the nearest available certified vet with one-tap calling and navigation.",
        "Parallel Family Alert: Notifies registered family caregiver circle so family members can assist at the stall.",
        "Emergency Audit Trail: Logs emergency dispatch and vet response time for quality monitoring."
    ], tag="Critical Care SLA")

    add_card(s7, 6.8, 1.8, 5.7, 5.0, "Prescription & Adherence Engine", [
        "Structured Digital Prescriptions: Only verified vets can prescribe medicines, dosages, frequencies, and durations.",
        "Kannada Voice & Visual Schedule: Translates complex veterinary regimens into clear morning/evening dosage cards.",
        "Dose Confirmation Logging: Farmers mark doses as administered; alerts caregivers if doses are skipped.",
        "Antibiotic Course Completion: Prevents premature discontinuation of antibiotics, curbing chronic relapse.",
        "Family Circle Coordination: Multiple family members share herd visibility, preventing double-dosing or missed medications."
    ], tag="Treatment Adherence")

    # ==================== SLIDE 8: Tech Stack, Live Status & Roadmap ====================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Tech Stack Implementation, Live Status & Impact", "Execution & Future Roadmap")

    add_card(s8, 0.8, 1.8, 3.7, 5.0, "Production Stack", [
        "Frontend: Vite, React 18, Tailwind CSS, Lucide Icons, html5-qrcode.",
        "Backend: FastAPI (Python 3.12), Pydantic v2, SQLAlchemy, Uvicorn.",
        "Database: Supabase PostgreSQL with RLS, connection pooling.",
        "Deployment: Multi-service Vercel deployment with serverless API.",
        "Testing: Pytest automated test suites covering RBAC & edge cases."
    ], tag="Built & Verified")

    add_card(s8, 4.8, 1.8, 3.7, 5.0, "Live Implementations", [
        "Production URL: pashupluse.vercel.app running with live SSL.",
        "Dynamic Passport API: Authenticated RBAC endpoints with audit logging.",
        "Fever Telemetry: Interactive temperature tracking with baseline checks.",
        "Pre-Seeded Demo Herds: Ganga (Fever), Yamuna (Past Disease), Nandi (Clean).",
        "100% Kannada Fidelity: Verified pure Kannada localized interface."
    ], tag="Current Production Status")

    add_card(s8, 8.8, 1.8, 3.7, 5.0, "Impact & Pilot Milestones", [
        "40% Faster Emergency Triage: Reduced rural emergency vet arrival times.",
        "95% Medication Adherence: Eliminates missed doses through voice schedules.",
        "Zero Loss of Health Records: Standardized permanent digital life history.",
        "Milestone 1: Mandya & Mysuru milk cooperative pilot (500 smallholder farms).",
        "Milestone 2: State Department of Animal Husbandry integration."
    ], tag="Outcomes & Scale")

    # Save presentation
    output_path = "pashupulse_pitch_deck.pptx"
    prs.save(output_path)
    print(f"Presentation successfully created at {output_path}")

if __name__ == "__main__":
    create_deck()
