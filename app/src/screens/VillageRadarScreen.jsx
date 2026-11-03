import React, { useState, useEffect } from 'react';
import {
  Radio,
  AlertOctagon,
  MapPin,
  Volume2,
  Filter,
  RefreshCw,
  Pill,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { useTranslation } from '../i18n';

export default function VillageRadarScreen() {
  const { language, t } = useTranslation();
  const [clusters, setClusters] = useState([]);
  const [districtFilter, setDistrictFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [expandedMeds, setExpandedMeds] = useState({});

  const toggleMeds = (id) => {
    setExpandedMeds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getFallbackClusters = () => [
    {
      id: 'c1',
      village_name: language === 'kn' ? 'ಪಾಂಡವಪುರ ಗ್ರಾಮಾಂತರ' : 'Pandavapura Rural',
      district: language === 'kn' ? 'ಮಂಡ್ಯ' : 'Mandya',
      disease_name: language === 'kn' ? 'ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗ (FMD) ಶಂಕೆ' : 'Foot-and-Mouth Disease (FMD) Suspected',
      cases_count: 6,
      status: 'SUSPECTED',
      risk_level: language === 'kn' ? 'ಹೆಚ್ಚಿನ ಅಪಾಯ' : 'HIGH',
      alert_message_kannada:
        'ಪಾಂಡವಪುರ ಸುತ್ತಮುತ್ತ 6 ಜಾನುವಾರುಗಳಲ್ಲಿ ಜೊಲ್ಲು ಸುರಿಯುವುದು ಮತ್ತು ಬಾಯಲ್ಲಿ ಗುಳ್ಳೆಗಳು ಕಂಡುಬಂದಿವೆ. ತಕ್ಷಣ ಹಸುಗಳನ್ನು ಪ್ರತ್ಯೇಕಿಸಿ ಲಸಿಕೆ ಪರಿಶೀಲಿಸಿ.',
      alert_message_english:
        '6 cattle reported with excessive salivation and oral blisters in Pandavapura cluster. Quarantine affected animals and verify FMD vaccination.',
      emergency_medicines: [
        {
          name: language === 'kn' ? 'ಪೊಟ್ಯಾಸಿಯಮ್ ಪರ್ಮಾಂಗನೇಟ್ (0.01% ದ್ರಾವಣ)' : 'Potassium Permanganate (0.01% Sol)',
          role: language === 'kn' ? 'ಆಂಟಿಸೆಪ್ಟಿಕ್ ಬಾಯಿ ತೊಳೆಯುವ ದ್ರಾವಣ' : 'Antiseptic Oral Wash',
          usage: language === 'kn' ? 'ಮೇವು ನೀಡುವ ಮುನ್ನ ದಿನಕ್ಕೆ 3 ಬಾರಿ ಬಾಯಿ ತೊಳೆಯಿರಿ.' : 'Wash mouth ulcers 3 times daily before feed.',
        },
        {
          name: language === 'kn' ? 'ಬೋರೋ-ಗ್ಲಿಸರಿನ್ ಮುಲಾಮು' : 'Boro-Glycerine Paint',
          role: language === 'kn' ? 'ಬಾಯಿಯ ಹುಣ್ಣು ನಿವಾರಕ' : 'Mucosal Protectant',
          usage: language === 'kn' ? 'ನಾಲಿಗೆ ಮತ್ತು ಬಾಯಿಯ ಗುಳ್ಳೆಗಳಿಗೆ ಮೃದುವಾಗಿ ಲೇಪಿಸಿ.' : 'Apply gently to tongue and oral blisters.',
        },
        {
          name: language === 'kn' ? 'ಮೆಲೋಕ್ಸಿಕಾಮ್ ಬೋಲಸ್ (100mg)' : 'Meloxicam Bolus (100mg)',
          role: language === 'kn' ? 'ಜ್ವರ ಮತ್ತು ನೋವು ನಿವಾರಕ' : 'Antipyretic / NSAID',
          usage: language === 'kn' ? 'ಜ್ವರ ಮತ್ತು ನೋವು ತಗ್ಗಿಸಲು 1 ಮಾತ್ರೆ ಬೆಳಿಗ್ಗೆ ಮತ್ತು ಸಂಜೆ.' : '1 bolus BID after feed for fever and pain relief.',
        },
        {
          name: language === 'kn' ? 'ಬೇವಿನ ಎಣ್ಣೆ ಮತ್ತು ಅರಿಶಿನ ಮುಲಾಮು' : 'Neem Oil & Fly-Repellent Ointment',
          role: language === 'kn' ? 'ಗೊರಸಿನ ಗಾಯದ ಆರೈಕೆ' : 'Hoof Wound Care',
          usage: language === 'kn' ? 'ಕಾಲುಗಳ ಗಾಯಗಳಿಗೆ ನೊಣ ಕೂರದಂತೆ ಪ್ರತಿದಿನ ಹಚ್ಚಿ.' : 'Apply to interdigital lesions to prevent maggot infection.',
        },
      ],
      biosecurity: language === 'kn'
        ? 'ಹಸುಗಳನ್ನು ಪ್ರತ್ಯೇಕ ಕೊಟ್ಟಿಗೆಯಲ್ಲಿ ಕಟ್ಟಿ, ಸಾಮಾನ್ಯ ಮೇಯಿಸುವ ಕೆರೆಗೆ ಬಿಡಬೇಡಿ.'
        : 'Quarantine affected cattle in isolated shed; avoid communal grazing ponds.',
    },
    {
      id: 'c2',
      village_name: language === 'kn' ? 'ಶ್ರೀರಂಗಪಟ್ಟಣ ಪೂರ್ವ' : 'Srirangapatna East',
      district: language === 'kn' ? 'ಮಂಡ್ಯ' : 'Mandya',
      disease_name: language === 'kn' ? 'ಚರ್ಮ ಗಂಟು ರೋಗ (LSD) ಎಚ್ಚರಿಕೆ' : 'Lumpy Skin Disease (LSD) Alert',
      cases_count: 4,
      status: 'UNDER_VERIFICATION',
      risk_level: language === 'kn' ? 'ಮಧ್ಯಮ ಅಪಾಯ' : 'MEDIUM',
      alert_message_kannada:
        'ಶ್ರೀರಂಗಪಟ್ಟಣ ತಾಲ್ಲೂಕಿನಲ್ಲಿ ಚರ್ಮದ ಗಂಟು ರೋಗದ ಲಕ್ಷಣಗಳು ತಪಾಸಣೆಯಲ್ಲಿದೆ. ನೊಣ-ಸೊಳ್ಳೆ ನಿಯಂತ್ರಣಕ್ಕೆ ಬೇವಿನ ಹೊಗೆ ಹಾಕಿ.',
      alert_message_english:
        'Cutaneous skin nodule cases under clinical verification in Srirangapatna. Maintain vector mosquito control.',
      emergency_medicines: [
        {
          name: language === 'kn' ? 'ಕ್ಲೋರ್ಫೆನಿರಮೈನ್ ಮಾಲೇಟ್ (ಅವಿಲ್ 10ml)' : 'Chlorpheniramine Maleate (Avil 10ml)',
          role: language === 'kn' ? 'ತುರಿಕೆ ಮತ್ತು ಅಲರ್ಜಿ ನಿರೋಧಕ' : 'Antihistaminic Injection',
          usage: language === 'kn' ? 'ಚರ್ಮದ ಉರಿಯೂತ ಮತ್ತು ತುರಿಕೆ ಕಡಿಮೆ ಮಾಡಲು ಇಂಜೆಕ್ಷನ್.' : 'Reduces severe allergic inflammation and skin itching.',
        },
        {
          name: language === 'kn' ? 'ಪ್ಯಾರಸಿಟಮಾಲ್ + ಮೆಲೋಕ್ಸಿಕಾಮ್ ಬೋಲಸ್' : 'Paracetamol + Meloxicam Bolus',
          role: language === 'kn' ? 'ಜ್ವರ ಮತ್ತು ಊತ ನಿವಾರಕ' : 'Fever & Edema Relief',
          usage: language === 'kn' ? 'ದಿನಕ್ಕೆ 2 ಮಾತ್ರೆಗಳು 3 ದಿನಗಳವರೆಗೆ.' : '2 boluses daily for 3 days.',
        },
        {
          name: language === 'kn' ? 'ಅರಿಶಿನ ಮತ್ತು ಬೇವಿನ ನೈಸರ್ಗಿಕ ಲೇಪನ' : 'Neem & Turmeric Organic Paste',
          role: language === 'kn' ? 'ಚರ್ಮದ ನಂಜುನಿರೋಧಕ' : 'Topical Antiseptic',
          usage: language === 'kn' ? 'ಚರ್ಮದ ಗಂಟುಗಳು ಒಡೆದ ಸ್ಥಳಗಳಿಗೆ ದಿನಕ್ಕೆ 2 ಬಾರಿ ಹಚ್ಚಿ.' : 'Apply to rupturing skin nodules twice daily.',
        },
      ],
      biosecurity: language === 'kn'
        ? 'ಕೊಟ್ಟಿಗೆಯ ಸುತ್ತ ಬೇವಿನ ಹೊಗೆ ಹಾಕಿ ಸೊಳ್ಳೆ, ನೊಣಗಳನ್ನು ನಿಯಂತ್ರಿಸಿ.'
        : 'Daily neem smoke fumigation to eliminate biting mosquitoes and flies.',
    },
    {
      id: 'c3',
      village_name: language === 'kn' ? 'ನಂಜನಗೂಡು ಕೈಗಾರಿಕಾ ವಲಯ' : 'Nanjangud Industrial Belt',
      district: language === 'kn' ? 'ಮೈಸೂರು' : 'Mysuru',
      disease_name: language === 'kn' ? 'ಕೆಚ್ಚಲು ಬಾವು ಕಾಲೋಚಿತ ಹರಡುವಿಕೆ' : 'Bovine Mastitis Seasonal Flare',
      cases_count: 5,
      status: 'CONFIRMED',
      risk_level: language === 'kn' ? 'ಹೆಚ್ಚಿನ ಅಪಾಯ' : 'HIGH',
      alert_message_kannada:
        'ನಂಜನಗೂಡು ಹಾಲಿನ ಕೇಂದ್ರ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಕೆಚ್ಚಲು ಬಾವು ದೃಢಪಟ್ಟಿದೆ. ಹಾಲು ಕರೆಯುವ ಮುನ್ನ ಮತ್ತು ನಂತರ ಸ್ವಚ್ಛತೆಗೆ ಆದ್ಯತೆ ನೀಡಿ.',
      alert_message_english:
        'Confirmed subclinical mastitis spike in Nanjangud milk collection zones. Post-milking antiseptic teat dipping mandated.',
      emergency_medicines: [
        {
          name: language === 'kn' ? 'ಇಂಟ್ರಾಮ್ಯಾಮರಿ ಕ್ಲಾಕ್ಸಾಸಿಲಿನ್ ಟ್ಯೂಬ್' : 'Intramammary Cloxacillin Infusion',
          role: language === 'kn' ? 'ಕೆಚ್ಚಲಿಗೆ ಹಾಕುವ ಆಂಟಿಬಯೋಟಿಕ್' : 'Targeted Teat Antibiotic',
          usage: language === 'kn' ? 'ಪೂರ್ಣ ಹಾಲು ಕರೆದ ನಂತರ ಬಾಧಿತ ಮೊಲೆತೊಟ್ಟಿಗೆ 1 ಟ್ಯೂಬ್ ಹಾಕಿ.' : 'Infuse 1 tube per affected quarter after thorough milk-out.',
        },
        {
          name: language === 'kn' ? 'ಸೆರಾಟಿಯೋಪೆಪ್ಟಿಡೇಸ್ + ಪ್ಯಾರಸಿಟಮಾಲ್' : 'Serratiopeptidase + Paracetamol',
          role: language === 'kn' ? 'ಕೆಚ್ಚಲ ಬಾವು ಕರಗಿಸುವ ಬೋಲಸ್' : 'Anti-Inflammatory Bolus',
          usage: language === 'kn' ? 'ಕೆಚ್ಚಲಿನ ಗಡಸುತನ ಮತ್ತು ನೋವು ಇಳಿಸಲು ದಿನಕ್ಕೆ 2 ಬಾರಿ.' : 'Reduces udder hardness and inflammatory edema.',
        },
        {
          name: language === 'kn' ? '0.5% ಪೋವಿಡೋನ್-ಅಯೋಡಿನ್ ಟೀಟ್ ಡಿಪ್' : '0.5% Povidone-Iodine Teat Dip',
          role: language === 'kn' ? 'ಹಾಲು ಕರೆದ ನಂತರದ ದ್ರಾವಣ' : 'Post-Milking Antiseptic',
          usage: language === 'kn' ? 'ಹಾಲು ಕರೆದ ತಕ್ಷಣ ಮೊಲೆತೊಟ್ಟುಗಳನ್ನು ದ್ರಾವಣದಲ್ಲಿ ಅದ್ದಿ.' : 'Dip all teat ends immediately following every milking.',
        },
      ],
      biosecurity: language === 'kn'
        ? 'ರೋಗಪೀಡಿತ ಮೊಲೆತೊಟ್ಟಿನ ಹಾಲನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಕರೆದು ಕ್ರಿಮಿನಾಶಕದಲ್ಲಿ ವಿಲೇವಾರಿ ಮಾಡಿ.'
        : 'Strip infected milk last and discard safely into disinfectant.',
    },
    {
      id: 'c4',
      village_name: language === 'kn' ? 'ಮದ್ದೂರು ತಾಲ್ಲೂಕು' : 'Maddur Taluk',
      district: language === 'kn' ? 'ಮಂಡ್ಯ' : 'Mandya',
      disease_name: language === 'kn' ? 'ಅಲ್ಪಕಾಲಿಕ ಬೋವೈನ್ ಜ್ವರ (3-ದಿನದ ಜ್ವರ)' : 'Acute Ephemeral 3-Day Fever',
      cases_count: 3,
      status: 'SUSPECTED',
      risk_level: language === 'kn' ? 'ವೀಕ್ಷಣೆ' : 'WATCH',
      alert_message_kannada:
        'ಮದ್ದೂರು ತಾಲ್ಲೂಕಿನಲ್ಲಿ ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಕುಂಟುವ ಲಕ್ಷಣಗಳು ವರದಿಯಾಗಿವೆ. ಪಶು ಪಲ್ಸ್ ಮೂಲಕ ತಕ್ಷಣ ತಪಾಸಣೆ ಕೋರಿ.',
      alert_message_english:
        'Transient 3-day stiffness and high fever cluster observed in Maddur. Report through Pashu Pulse for triage.',
      emergency_medicines: [
        {
          name: language === 'kn' ? 'ಫ್ಲೂನಿಕ್ಸಿನ್ / ಮೆಲೋಕ್ಸಿಕಾಮ್ ಇಂಜೆಕ್ಷನ್' : 'Flunixin Meglumine / Meloxicam',
          role: language === 'kn' ? 'ಜ್ವರ ಮತ್ತು ನೋವು ನಿವಾರಕ' : 'Antipyretic Analgesic',
          usage: language === 'kn' ? '104-105°F ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಕುಂಟುವಿಕೆಗೆ ತ್ವರಿತ ಚಿಕಿತ್ಸೆ.' : 'Immediate relief for 105°F 3-day stiff sickness.',
        },
        {
          name: language === 'kn' ? 'ಬಿ-ಕಾಂಪ್ಲೆಕ್ಸ್ ಲಿವರ್ ಟಾನಿಕ್' : 'B-Complex with Liver Extract Syrup',
          role: language === 'kn' ? 'ಜೀರ್ಣಕ್ರಿಯೆ ಉದ್ದೀಪಕ' : 'Metabolic Stimulant',
          usage: language === 'kn' ? 'ಆಹಾರ ಸೇವನೆ ಹೆಚ್ಚಿಸಲು ದಿನಕ್ಕೆ 50 ಮಿ.ಲೀ ಕುಡಿಸಿ.' : '50 ml daily to revive rumen motility and appetite.',
        },
        {
          name: language === 'kn' ? 'ಎಲೆಕ್ಟ್ರೋಲೈಟ್ ಮತ್ತು ಗ್ಲೂಕೋಸ್ ದ್ರಾವಣ' : 'Oral Electrolyte & Dextrose Sachet',
          role: language === 'kn' ? 'ನಿರ್ಜಲೀಕರಣ ತಡೆಗಟ್ಟುವಿಕೆ' : 'Anti-Dehydration Energy',
          usage: language === 'kn' ? 'ಹಸು ಮಲಗಿಕೊಳ್ಳದಂತೆ ಶಕ್ತಿ ನೀಡಲು 5 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಕೊಡಿ.' : 'Dissolve in 5L lukewarm water to prevent recumbency.',
        },
      ],
      biosecurity: language === 'kn'
        ? 'ತಂಪಾದ ನೆರಳಿನಲ್ಲಿ ವಿಶ್ರಾಂತಿ ನೀಡಿ, ಮೃದುವಾದ ಹಸಿರು ಹುಲ್ಲು ಮತ್ತು ಶುದ್ಧ ನೀರು ಒದಗಿಸಿ.'
        : 'Provide deep straw bedding, shade, soft green fodder, and hydration.',
    },
    {
      id: 'c5',
      village_name: language === 'kn' ? 'ಹುಣಸೂರು ಅರಣ್ಯ ಗಡಿ' : 'Hunsur Forest Border',
      district: language === 'kn' ? 'ಮೈಸೂರು' : 'Mysuru',
      disease_name: language === 'kn' ? 'ಕಪ್ಪು ಕಾಲು ರೋಗ (BQ) ಎಚ್ಚರಿಕೆ' : 'Black Quarter (BQ) Outbreak',
      cases_count: 2,
      status: 'CONFIRMED',
      risk_level: language === 'kn' ? 'ಹೆಚ್ಚಿನ ಅಪಾಯ' : 'HIGH',
      alert_message_kannada:
        'ಹುಣಸೂರು ತಾಲ್ಲೂಕಿನಲ್ಲಿ ಕಪ್ಪು ಕಾಲು ರೋಗದ (BQ) ಪ್ರಕರಣ ದೃಢಪಟ್ಟಿದೆ. ಸುತ್ತಮುತ್ತಲಿನ 5 ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ತುರ್ತು ರಿಂಗ್ ಲಸಿಕೆ ಆರಂಭಿಸಿ.',
      alert_message_english:
        'Confirmed Black Quarter (BQ) outbreak near Hunsur. Ring vaccination and strict carcass disposal protocols deployed.',
      emergency_medicines: [
        {
          name: language === 'kn' ? 'ಪ್ರೊಕೇನ್ ಪೆನಿಸಿಲಿನ್ ಜಿ (ಹೆಚ್ಚಿನ ಡೋಸ್)' : 'Procaine Penicillin G (High Dose)',
          role: language === 'kn' ? 'ತುರ್ತು ಆಂಟಿಬಯೋಟಿಕ್' : 'Clostridial Antibiotic',
          usage: language === 'kn' ? 'ರೋಗಲಕ್ಷಣ ಕಂಡುಬಂದ ತಕ್ಷಣ ಪಶುವೈದ್ಯರಿಂದ ಕೊಡಿಸಿ.' : 'Urgent veterinary administration at earliest onset.',
        },
        {
          name: language === 'kn' ? 'ಬಿಕ್ಯೂ ಹೈಪರ್ಇಮ್ಯೂನ್ ಸೀರಮ್' : 'Polyvalent BQ Hyperimmune Serum',
          role: language === 'kn' ? 'ತುರ್ತು ರೋಗನಿರೋಧಕ ಸೀರಮ್' : 'Emergency Antiserum',
          usage: language === 'kn' ? 'ಸಂಪರ್ಕದಲ್ಲಿರುವ ಜಾನುವಾರುಗಳಿಗೆ ತಕ್ಷಣ ರಕ್ಷಣೆ.' : 'Passive immunity for in-contact cattle within cluster.',
        },
      ],
      biosecurity: language === 'kn'
        ? 'ಸತ್ತ ಪ್ರಾಣಿಯ ಶವವನ್ನು ಸುಣ್ಣ ಹಾಕಿ 6 ಅಡಿ ಆಳದಲ್ಲಿ ಹೂಳಬೇಕು, ಚರ್ಮ ತೆಗೆಯಬಾರದು.'
        : 'Strict carcass deep burial with unslaked lime (do not open skin).',
    },
    {
      id: 'c6',
      village_name: language === 'kn' ? 'ಕೆ.ಆರ್. ಪೇಟೆ ಹಾಲು ಒಕ್ಕೂಟ' : 'KR Pet Dairy Cooperative',
      district: language === 'kn' ? 'ಮಂಡ್ಯ' : 'Mandya',
      disease_name: language === 'kn' ? 'ಉಣ್ಣೆ ಜ್ವರ (ಥೈಲೇರಿಯಾಸಿಸ್)' : 'Theileriosis Tick Fever',
      cases_count: 4,
      status: 'UNDER_VERIFICATION',
      risk_level: language === 'kn' ? 'ಮಧ್ಯಮ ಅಪಾಯ' : 'MEDIUM',
      alert_message_kannada:
        'ಕೆ.ಆರ್. ಪೇಟೆ ಹಾಲು ಒಕ್ಕೂಟ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಉಣ್ಣೆ ಜ್ವರ (ಥೈಲೇರಿಯಾಸಿಸ್) ಶಂಕೆ. ಉಣ್ಣೆ ನಿಯಂತ್ರಣಕ್ಕೆ ಕೀಟನಾಶಕ ದ್ರಾವಣ ಸಿಂಪಡಿಸಿ.',
      alert_message_english:
        'Theileriosis tick-borne febrile syndrome under laboratory screening in KR Pet dairy cooperative farms.',
      emergency_medicines: [
        {
          name: language === 'kn' ? 'ಬುಪಾರ್ವಾಕ್ವೋನ್ (2.5 mg/kg)' : 'Buparvaquone (2.5 mg/kg IM)',
          role: language === 'kn' ? 'ಉಣ್ಣೆ ಜ್ವರ ನಿರ್ದಿಷ್ಟ ಔಷಧ' : 'Specific Antiprotozoal',
          usage: language === 'kn' ? 'ಪಶುವೈದ್ಯರ ಮೇಲ್ವಿಚಾರಣೆಯಲ್ಲಿ ಒಂದೇ ಡೋಸ್ ಇಂಜೆಕ್ಷನ್.' : 'Curative single dose under veterinary care.',
        },
        {
          name: language === 'kn' ? 'ಡೆಲ್ಟಾಮೆಥ್ರಿನ್ / ಫ್ಲೂಮೆಥ್ರಿನ್ ದ್ರಾವಣ' : 'Flumethrin / Deltamethrin Pour-On',
          role: language === 'kn' ? 'ಉಣ್ಣೆ ನಾಶಕ ದ್ರಾವಣ' : 'Acaricide Tick Kill',
          usage: language === 'kn' ? 'ಬೆನ್ನು ಮೂಳೆಯ ಉದ್ದಕ್ಕೂ 10 ಮಿ.ಲೀ ಹಾಕಿ ಉಣ್ಣೆಗಳನ್ನು ನಿರ್ಮೂಲನೆ ಮಾಡಿ.' : 'Apply 10ml along spine to eradicate vectors.',
        },
        {
          name: language === 'kn' ? 'ಕಬ್ಬಿಣ ಮತ್ತು ಬಿ12 ರಕ್ತವರ್ಧಕ ಟಾನಿಕ್' : 'Iron Dextran + Vitamin B12 Tonic',
          role: language === 'kn' ? 'ರಕ್ತಹೀನತೆ ನಿವಾರಕ' : 'Haematinic Blood Builder',
          usage: language === 'kn' ? 'ಉಣ್ಣೆಯಿಂದ ಕಳೆದುಹೋದ ರಕ್ತ ಕಣಗಳನ್ನು ಪುನರುಜ್ಜೀವನಗೊಳಿಸಲು.' : 'Counteracts severe tick-borne anemia.',
        },
      ],
      biosecurity: language === 'kn'
        ? 'ಕೊಟ್ಟಿಗೆಯ ಗೋಡೆಗಳಲ್ಲಿನ ಬಿರುಕುಗಳಿಗೆ ಸುಣ್ಣ ಮತ್ತು ಕೀಟನಾಶಕ ಹಚ್ಚಿ ಉಣ್ಣೆಗಳನ್ನು ನಾಶಪಡಿಸಿ.'
        : 'Plaster shed cracks and spray acaricide to eliminate hiding tick eggs.',
    },
  ];

  const loadClusters = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/village-radar/clusters');
      if (data && data.clusters && data.clusters.length > 0) {
        // Map backend enriched medicines to current language
        const mapped = data.clusters.map((c) => ({
          ...c,
          emergency_medicines:
            language === 'kn'
              ? c.emergency_medicines_kn || c.emergency_medicines
              : c.emergency_medicines_en || c.emergency_medicines,
        }));
        setClusters(mapped);
      } else {
        setClusters(getFallbackClusters());
      }
    } catch (e) {
      setClusters(getFallbackClusters());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, [language]);

  const handlePlayAudio = (cluster) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = language === 'kn' ? cluster.alert_message_kannada : cluster.alert_message_english;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
      utterance.onstart = () => setPlayingId(cluster.id);
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      alert(language === 'kn' ? cluster.alert_message_kannada : cluster.alert_message_english);
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'SUSPECTED') return t('radar_status_suspected') || 'Suspected';
    if (status === 'UNDER_VERIFICATION') return t('radar_status_verification') || 'Under Verification';
    if (status === 'CONFIRMED') return t('radar_status_confirmed') || 'Confirmed';
    return status;
  };

  const filtered = clusters.filter(
    (c) =>
      districtFilter === 'All' ||
      c.district.toLowerCase().includes(districtFilter.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto animate-fade-in text-slate-800">
      {/* Official Prototype Synthetic Data Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl font-black text-xs flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <AlertOctagon size={18} className="shrink-0" />
          <span>{t('radar_synthetic_banner')}</span>
        </div>
        <span className="text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-bold">
          {language === 'kn' ? 'ಪಾರದರ್ಶಕತೆ' : 'TRANSPARENCY'}
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-950 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600/60 flex items-center justify-center">
              <Radio size={18} className="text-teal-300 animate-pulse" />
            </div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-teal-300">
              {language === 'kn' ? 'ಜೈವಿಕ ನಿಗಾ ಮತ್ತು ತುರ್ತು ಔಷಧ ವ್ಯವಸ್ಥೆ' : 'Biosurveillance & Radar Medicine'}
            </span>
          </div>

          <button
            onClick={loadClusters}
            className="p-1.5 rounded-xl bg-teal-800/60 hover:bg-teal-700 text-teal-200 text-xs flex items-center space-x-1"
            title="Refresh clusters"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="text-[11px]">{language === 'kn' ? 'ನವೀಕರಿಸಿ' : 'Refresh'}</span>
          </button>
        </div>

        <h2 className="text-xl font-black leading-tight">
          {t('radar_title')}
        </h2>
        <p className="text-xs text-teal-200 mt-1 max-w-md">
          {t('radar_sub')}
        </p>

        {/* District Filter Chips */}
        <div className="mt-4 flex items-center space-x-2 text-xs">
          <span className="font-bold text-teal-300 mr-1 flex items-center">
            <Filter size={12} className="mr-1" />
            {t('radar_filter_district')}
          </span>
          {[
            { id: 'All', label: language === 'kn' ? 'ಎಲ್ಲಾ (All)' : 'All' },
            { id: 'Mandya', label: language === 'kn' ? 'ಮಂಡ್ಯ (Mandya)' : 'Mandya' },
            { id: 'Mysuru', label: language === 'kn' ? 'ಮೈಸೂರು (Mysuru)' : 'Mysuru' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setDistrictFilter(d.id)}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                districtFilter === d.id
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'bg-teal-950/70 text-teal-200 border border-teal-800'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Outbreak Clusters List */}
      <div className="space-y-4">
        {filtered.map((cluster) => {
          const isConfirmed = cluster.status === 'CONFIRMED';
          const isSuspected = cluster.status === 'SUSPECTED';
          const isMedsOpen = !!expandedMeds[cluster.id];
          const meds = cluster.emergency_medicines || [];

          return (
            <div
              key={cluster.id}
              className={`rounded-3xl p-5 border shadow-sm space-y-3.5 transition-all ${
                isConfirmed
                  ? 'bg-red-50/70 border-red-300'
                  : isSuspected
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-blue-50/70 border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className={isConfirmed ? 'text-red-600' : 'text-amber-600'} />
                    <h3 className="font-black text-slate-900 text-base">{cluster.village_name}</h3>
                    <span className="text-xs font-bold text-slate-500">({cluster.district})</span>
                  </div>
                  <p className="font-extrabold text-sm text-slate-800 mt-0.5">{cluster.disease_name}</p>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isConfirmed
                      ? 'bg-red-600 text-white'
                      : isSuspected
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {getStatusLabel(cluster.status)}
                </span>
              </div>

              {/* Advisory Message */}
              <div className="bg-white/80 rounded-2xl p-3.5 border border-slate-200/60 text-xs">
                <span className="font-bold text-slate-700 block mb-1">
                  {t('radar_advisory_label')}
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {language === 'kn' ? cluster.alert_message_kannada : cluster.alert_message_english}
                </p>
              </div>

              {/* Cluster Stats & Audio Broadcast */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-center space-x-3 text-slate-600 font-semibold">
                  <span>
                    {language === 'kn' ? 'ದಾಖಲಾದ ಪ್ರಕರಣಗಳು:' : 'Reported Cases:'}{' '}
                    <b className="text-slate-900">
                      {cluster.cases_count} {language === 'kn' ? 'ಜಾನುವಾರುಗಳು' : 'animals'}
                    </b>
                  </span>
                  <span>•</span>
                  <span>
                    {language === 'kn' ? 'ಅಪಾಯ ಮಟ್ಟ:' : 'Risk Level:'}{' '}
                    <b className={isConfirmed ? 'text-red-700 font-bold' : 'text-amber-700 font-bold'}>
                      {cluster.risk_level}
                    </b>
                  </span>
                </div>

                <button
                  onClick={() => handlePlayAudio(cluster)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all ${
                    playingId === cluster.id
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                  }`}
                >
                  <Volume2 size={14} className={playingId === cluster.id ? 'text-white' : 'text-emerald-700'} />
                  <span>{playingId === cluster.id ? (language === 'kn' ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Playing...') : t('radar_audio_btn')}</span>
                </button>
              </div>

              {/* RADAR MEDICINE & TREATMENT PROTOCOL TOGGLE */}
              <div className="pt-1">
                <button
                  onClick={() => toggleMeds(cluster.id)}
                  className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all ${
                    isMedsOpen
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                      : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Pill size={15} className={isMedsOpen ? 'text-white' : 'text-emerald-600'} />
                    <span>
                      {language === 'kn'
                        ? 'ತುರ್ತು ಔಷಧಗಳು ಮತ್ತು ಚಿಕಿತ್ಸಾ ಮಾರ್ಗಸೂಚಿ (Radar Medicines)'
                        : 'Emergency Medicines & Protocol (Radar Medicines)'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-900 font-black">
                      {meds.length}
                    </span>
                  </div>
                  {isMedsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Expanded Medicine & Treatment Drawer */}
                {isMedsOpen && (
                  <div className="mt-2.5 bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm space-y-3 animate-fade-in text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-1.5">
                        <ShieldCheck size={16} className="text-emerald-700" />
                        <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                          {language === 'kn' ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಔಷಧಗಳು' : 'Prescribed Radar Medicines'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {language === 'kn' ? 'ಪಶುವೈದ್ಯರ ಸಲಹೆಯಂತೆ' : 'Under Vet Supervision'}
                      </span>
                    </div>

                    <div className="grid gap-2">
                      {meds.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between space-x-2"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-slate-900 text-xs">{med.name}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {med.role}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                              {med.usage}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Biosecurity & Vet Hotline CTA */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-semibold flex items-center space-x-1">
                        <Sparkles size={12} className="text-emerald-600" />
                        <span>{language === 'kn' ? 'ತುರ್ತು ಸಹಾಯವಾಣಿ:' : 'Veterinary Hotline:'}</span>
                        <b className="text-slate-900 font-mono">1800-PASHU-PULSE</b>
                      </span>

                      <a
                        href="tel:1800727487"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 shadow-sm active:scale-95"
                      >
                        <PhoneCall size={12} />
                        <span>{language === 'kn' ? 'ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ' : 'Call Doctor'}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
