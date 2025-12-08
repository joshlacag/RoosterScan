-- Treatment Protocols Table for RoosterScan
-- Stores veterinary-validated treatment protocols for each injury type

CREATE TABLE treatments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    injury_type TEXT NOT NULL UNIQUE CHECK (injury_type IN ('bumblefoot', 'wing_injury', 'comb_damage', 'feather_loss', 'healthy')),
    title TEXT NOT NULL,
    description TEXT,
    
    -- Treatment phases (4-phase structure)
    phase1_title TEXT NOT NULL,
    phase1_actions TEXT[] NOT NULL,
    
    phase2_title TEXT NOT NULL,
    phase2_actions TEXT[] NOT NULL,
    
    phase3_title TEXT NOT NULL,
    phase3_actions TEXT[] NOT NULL,
    
    phase4_title TEXT NOT NULL,
    phase4_actions TEXT[] NOT NULL,
    
    -- Metadata
    severity_level TEXT CHECK (severity_level IN ('mild', 'moderate', 'severe')),
    estimated_recovery_days INTEGER,
    requires_vet BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

-- Public read access for treatment protocols
CREATE POLICY "Treatment protocols are publicly readable" ON treatments FOR SELECT USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default treatment protocols
INSERT INTO treatments (injury_type, title, description, 
    phase1_title, phase1_actions,
    phase2_title, phase2_actions,
    phase3_title, phase3_actions,
    phase4_title, phase4_actions,
    severity_level, estimated_recovery_days, requires_vet) 
VALUES 
(
    'bumblefoot',
    'Bumblefoot Treatment Protocol',
    'Comprehensive treatment for bumblefoot (pododermatitis) in gamefowl',
    'Immediate First Aid',
    ARRAY[
        'Isolate affected rooster to prevent further injury',
        'Soak foot in warm Epsom salt solution (15 minutes)',
        'Gently clean affected area with antiseptic solution',
        'Apply antibiotic ointment (Neosporin or similar)',
        'Wrap with clean, sterile bandage'
    ],
    'Veterinary Treatment',
    ARRAY[
        'Schedule vet appointment within 24-48 hours',
        'Vet may prescribe oral antibiotics (Baytril, Amoxicillin)',
        'Possible surgical removal of infection core if severe',
        'Pain management medication if needed',
        'Follow vet''s specific treatment plan'
    ],
    'Home Care & Recovery',
    ARRAY[
        'Change bandages daily, keep wound clean and dry',
        'Monitor for signs of infection (heat, swelling, odor)',
        'Provide easy access to food and water',
        'Continue treatment for 7-14 days or until healed',
        'Keep rooster on soft bedding (straw, shavings)'
    ],
    'Prevention',
    ARRAY[
        'Improve coop flooring - avoid sharp edges and rough surfaces',
        'Maintain clean, dry bedding',
        'Regular foot inspections (weekly)',
        'Ensure proper nutrition with vitamin A supplementation',
        'Avoid obesity - maintain healthy weight'
    ],
    'moderate',
    14,
    true
),
(
    'wing_injury',
    'Wing Injury Treatment Protocol',
    'Treatment protocol for wing fractures, sprains, and soft tissue injuries',
    'Immediate First Aid',
    ARRAY[
        'Gently examine wing without forcing movement',
        'Immobilize wing against body using soft wrap',
        'Apply cold compress for 10-15 minutes to reduce swelling',
        'Keep rooster calm and quiet in darkened area',
        'Limit movement and handling'
    ],
    'Veterinary Treatment',
    ARRAY[
        'X-rays to determine extent of injury',
        'Professional splinting or wrapping technique',
        'Anti-inflammatory medication if prescribed',
        'Pain management as needed',
        'Follow-up appointments for healing progress'
    ],
    'Home Care & Recovery',
    ARRAY[
        'Keep rooster in small, quiet enclosure (2-4 weeks)',
        'Check wrapping daily - ensure not too tight',
        'Prevent pecking from other birds',
        'Provide easily accessible food and water',
        'Monitor for signs of infection or complications'
    ],
    'Prevention',
    ARRAY[
        'Remove hazards from coop (sharp objects, wire)',
        'Ensure adequate space to prevent overcrowding',
        'Avoid rough handling during transport',
        'Provide proper perch height and design',
        'Regular wing and body condition checks'
    ],
    'moderate',
    21,
    true
),
(
    'comb_damage',
    'Comb Damage Treatment Protocol',
    'Treatment for comb injuries including lacerations, frostbite, and trauma',
    'Immediate First Aid',
    ARRAY[
        'Clean wound with saline solution or clean water',
        'Apply gentle pressure with clean cloth if bleeding',
        'Use styptic powder or cornstarch to stop bleeding',
        'Apply antibiotic ointment to prevent infection',
        'Isolate from other birds to prevent pecking'
    ],
    'Veterinary Assessment',
    ARRAY[
        'Consult vet if bleeding doesn''t stop within 10 minutes',
        'Professional evaluation for deep lacerations',
        'Possible sutures for severe tears',
        'Tetanus prevention if needed',
        'Antibiotics for infected wounds'
    ],
    'Home Care & Recovery',
    ARRAY[
        'Clean and reapply ointment twice daily',
        'Monitor for signs of infection (pus, swelling, odor)',
        'Keep area dry and clean',
        'Prevent further trauma from other birds',
        'Recovery typically 7-10 days for minor injuries'
    ],
    'Prevention',
    ARRAY[
        'Separate aggressive birds',
        'Provide adequate space and resources',
        'Protect from frostbite in cold weather (petroleum jelly)',
        'Remove sharp objects from coop',
        'Regular health checks and early intervention'
    ],
    'mild',
    10,
    false
),
(
    'feather_loss',
    'Feather Loss Treatment Protocol',
    'Treatment for feather loss due to molting, parasites, or stress',
    'Initial Assessment',
    ARRAY[
        'Examine skin for parasites (mites, lice)',
        'Check for signs of pecking or bullying',
        'Assess diet and nutrition quality',
        'Look for signs of stress or illness',
        'Determine if seasonal molting or pathological'
    ],
    'Parasite Treatment',
    ARRAY[
        'Apply poultry dust or spray (permethrin-based)',
        'Treat entire flock, not just affected bird',
        'Clean and treat coop, nesting boxes, and perches',
        'Repeat treatment in 7-10 days to kill newly hatched parasites',
        'Provide dust bath area with diatomaceous earth'
    ],
    'Nutritional Support',
    ARRAY[
        'Increase protein intake (16-20% protein feed)',
        'Add vitamins and minerals (poultry supplement)',
        'Provide fresh greens and vegetables',
        'Ensure constant access to clean water',
        'Consider probiotics for gut health'
    ],
    'Environmental Management',
    ARRAY[
        'Reduce stress factors (overcrowding, predators)',
        'Maintain proper lighting (14-16 hours for layers)',
        'Ensure adequate ventilation without drafts',
        'Separate aggressive birds if pecking occurs',
        'Monitor for regrowth over 4-8 weeks'
    ],
    'mild',
    30,
    false
),
(
    'healthy',
    'Healthy Rooster Maintenance',
    'Preventive care and maintenance for healthy gamefowl',
    'Regular Health Checks',
    ARRAY[
        'Weekly visual inspection of body, feet, and feathers',
        'Monitor eating and drinking behavior',
        'Check droppings for abnormalities',
        'Observe activity level and behavior',
        'Maintain health records and scan history'
    ],
    'Preventive Care',
    ARRAY[
        'Annual veterinary check-up recommended',
        'Keep vaccinations up to date',
        'Regular deworming schedule (every 3-6 months)',
        'Parasite prevention program',
        'Maintain biosecurity protocols'
    ],
    'Optimal Nutrition',
    ARRAY[
        'Provide balanced, age-appropriate feed',
        'Fresh, clean water available 24/7',
        'Supplement with greens and vegetables',
        'Grit and oyster shell as needed',
        'Avoid sudden diet changes'
    ],
    'Environment & Enrichment',
    ARRAY[
        'Clean coop weekly, deep clean monthly',
        'Provide adequate space (4 sq ft per bird minimum)',
        'Safe outdoor access for exercise',
        'Proper ventilation and temperature control',
        'Enrichment activities (perches, dust baths, foraging)'
    ],
    'mild',
    0,
    false
);
