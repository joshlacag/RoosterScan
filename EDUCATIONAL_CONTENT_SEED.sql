-- Educational Content Seed Data for RoosterScan
-- Run this in your Supabase SQL Editor to populate educational_content table
-- This is SAFE - only inserts data, doesn't modify any code

-- Insert educational articles
INSERT INTO educational_content (
  title,
  content_type,
  category,
  difficulty_level,
  content_text,
  media_urls,
  estimated_read_time,
  tags,
  is_published
) VALUES

-- Article 1: Understanding Rooster Anatomy
(
  'Understanding Rooster Anatomy: The 17 Key Points',
  'article',
  'anatomy',
  'beginner',
  'Learn about the 17 anatomical keypoints that RoosterScan detects during pose analysis. Understanding these points helps you better interpret AI analysis results and monitor your rooster''s health. The keypoints include: beak tip, eye, comb top, neck base, chest, back mid, tail base, wing shoulders, wing elbows, wing tips, leg joints, and feet. Each point provides valuable information about your rooster''s posture and potential health issues.',
  '[]'::jsonb,
  5,
  ARRAY['anatomy', 'keypoints', 'pose detection', 'basics'],
  true
),

-- Article 2: How to Take Good Photos
(
  'How to Take Quality Photos for AI Analysis',
  'article',
  'anatomy',
  'beginner',
  'Getting accurate AI analysis starts with good quality images. Follow these tips: Use natural lighting or bright indoor lights. Position your rooster in profile (side view) for best results. Ensure the full body is visible in the frame. Use a plain background when possible. Keep the camera steady and at rooster body level. Avoid shadows and glare. Take multiple photos from different angles. The better your photo quality, the more accurate the AI analysis will be.',
  '[]'::jsonb,
  3,
  ARRAY['photography', 'tips', 'image quality', 'how-to'],
  true
),

-- Article 3: Signs of a Healthy Rooster
(
  'Recognizing Signs of a Healthy Rooster',
  'article',
  'injury_prevention',
  'beginner',
  'A healthy rooster displays several key indicators: Alert and active behavior, bright clear eyes, smooth even feather coverage, upright posture with balanced stance, symmetrical wing carriage, even gait without limping, good appetite and normal droppings, vibrant comb and wattle color, and responsive to surroundings. Regular observation helps you establish a baseline for your rooster''s normal behavior, making it easier to spot early signs of health issues.',
  '[]'::jsonb,
  4,
  ARRAY['health', 'wellness', 'observation', 'prevention'],
  true
),

-- Article 4: Understanding Pose Detection
(
  'How AI Pose Detection Works in RoosterScan',
  'article',
  'anatomy',
  'intermediate',
  'RoosterScan uses advanced YOLO-based pose estimation to detect 17 anatomical keypoints on your rooster. The AI model was trained on hundreds of annotated rooster images to recognize these specific points with 63-84% confidence. The system analyzes the spatial relationships between keypoints to assess posture and detect potential abnormalities. Sequential validation ensures only high-quality detections proceed to health classification, improving overall accuracy.',
  '[]'::jsonb,
  6,
  ARRAY['AI', 'technology', 'pose detection', 'how it works'],
  true
),

-- Article 5: Interpreting Confidence Scores
(
  'Understanding AI Confidence Scores',
  'article',
  'anatomy',
  'intermediate',
  'Confidence scores indicate how certain the AI is about its detections. Scores range from 0-100%. Higher scores (above 80%) indicate strong confidence. Scores between 65-80% are good and reliable. Scores below 65% may require re-scanning with better image quality. The system uses quality gates to filter low-confidence results. Multiple factors affect confidence: image quality, lighting, rooster positioning, and pose clarity. Understanding these scores helps you interpret results accurately.',
  '[]'::jsonb,
  4,
  ARRAY['confidence', 'interpretation', 'results', 'understanding'],
  true
),

-- Article 6: Common Health Issues
(
  'Common Health Issues in Gamefowl',
  'article',
  'treatment',
  'intermediate',
  'Gamefowl can experience various health conditions. Common issues include: respiratory infections (sneezing, discharge), parasites (mites, lice, worms), foot problems (bumblefoot, scaly leg), injuries (wing damage, leg injuries), nutritional deficiencies, and stress-related conditions. Early detection is crucial for successful treatment. Regular health monitoring with RoosterScan can help identify postural changes that may indicate underlying health issues. Always consult a veterinarian for proper diagnosis and treatment.',
  '[]'::jsonb,
  7,
  ARRAY['health issues', 'diseases', 'treatment', 'veterinary'],
  true
),

-- Article 7: Injury Prevention
(
  'Preventing Common Rooster Injuries',
  'article',
  'injury_prevention',
  'beginner',
  'Prevention is better than treatment. Key strategies include: Provide adequate space to prevent overcrowding. Use appropriate perch heights and widths. Ensure smooth surfaces without sharp edges. Maintain clean, dry bedding. Provide balanced nutrition for strong bones. Regular health checks to catch issues early. Proper handling techniques to avoid stress injuries. Safe enclosure design to prevent escapes and predator attacks. Good lighting to prevent accidents. These practices significantly reduce injury risk.',
  '[]'::jsonb,
  5,
  ARRAY['prevention', 'safety', 'care', 'management'],
  true
),

-- Article 8: When to Consult a Vet
(
  'When to Seek Veterinary Care',
  'article',
  'treatment',
  'beginner',
  'While RoosterScan provides valuable health insights, professional veterinary care is essential for: Confirmed injuries or abnormalities, persistent limping or mobility issues, visible wounds or swelling, sudden behavior changes, loss of appetite lasting more than 24 hours, respiratory distress, neurological symptoms (head tilt, loss of balance), any condition that worsens despite home care. AI analysis is a screening tool, not a replacement for veterinary diagnosis. Early professional intervention improves treatment outcomes.',
  '[]'::jsonb,
  4,
  ARRAY['veterinary', 'professional care', 'when to act', 'emergency'],
  true
),

-- Article 9: Nutrition and Health
(
  'Nutrition Basics for Healthy Roosters',
  'article',
  'breeding',
  'intermediate',
  'Proper nutrition is fundamental to rooster health. Essential components include: High-quality protein (16-20% for maintenance), balanced vitamins and minerals, adequate calcium for bone health, clean fresh water at all times, appropriate energy levels for activity, and digestive health support. Poor nutrition can manifest as postural problems, weak bones, poor feather quality, and reduced immunity. Nutritional deficiencies may be detected through pose analysis as roosters compensate for weakness or discomfort.',
  '[]'::jsonb,
  6,
  ARRAY['nutrition', 'diet', 'feeding', 'health'],
  true
),

-- Article 10: Using RoosterScan Effectively
(
  'Getting the Most from RoosterScan',
  'article',
  'injury_prevention',
  'beginner',
  'Maximize RoosterScan''s effectiveness with these practices: Scan regularly to establish health baselines. Keep a consistent photo angle and lighting. Document any concerns in scan notes. Compare results over time to track changes. Use scan history to monitor progress. Combine AI insights with your observations. Share results with your veterinarian when needed. Remember that AI is a tool to support, not replace, your judgment and professional veterinary care. Regular monitoring enables early detection and better outcomes.',
  '[]'::jsonb,
  5,
  ARRAY['tips', 'best practices', 'how-to', 'effectiveness'],
  true
);

-- Verify insertion
SELECT COUNT(*) as total_articles FROM educational_content WHERE is_published = true;
