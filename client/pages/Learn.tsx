import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Educational Content Types
type EducationalContent = {
  id: string;
  title: string;
  description: string;
  content_type: 'article' | 'video' | 'interactive_3d' | 'quiz';
  category: 'anatomy' | 'injury_prevention' | 'treatment' | 'breeding' | 'general';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  content_url?: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
};

// Simple API function for educational content
const fetchEducationalContent = async (): Promise<EducationalContent[]> => {
  try {
    const response = await fetch('/api/education');
    if (!response.ok) {
      throw new Error('Failed to fetch educational content');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching educational content:', error);
    return [];
  }
};

const IMAGE_URL =
  "https://cdn.builder.io/api/v1/image/assets%2F792de1aab9d940efa21e876540d6f00c%2Ff83dc14e9875420f9ca5f995665767a9?format=webp&width=800";

type Hotspot = {
  key: "head" | "wing" | "spine" | "keel" | "leg";
  name: string;
  tip: string;
  watch: string[];
  x: number; // percentage of container width
  y: number; // percentage of container height
};

const DEFAULT_PARTS: Hotspot[] = [
  {
    key: "head",
    name: "Head/Eyes",
    tip: "The head region includes the beak, eyes, comb, and wattles. Check for discharge, asymmetry, or reduced responsiveness. Healthy eyes should be clear and bright. The comb should be vibrant red and firm.",
    watch: ["Eye discharge or cloudiness", "Uneven pupils or drooping eyelids", "Lethargy or head tilt", "Pale or dark comb color", "Nasal discharge", "Swollen wattles"],
    x: 18,
    y: 29,
  },
  {
    key: "wing",
    name: "Wing",
    tip: "Wings should be carried symmetrically and close to the body. Check for droop, limited extension, or heat/swelling around joints. Wing injuries often result from trauma, fighting, or muscle strain.",
    watch: ["Droop on rest (one wing lower)", "Uneven flap or limited range of motion", "Pain on extension or palpation", "Swelling at shoulder or elbow joints", "Feather damage or missing primaries", "Heat or tenderness in wing area"],
    x: 40,
    y: 48,
  },
  {
    key: "spine",
    name: "Spine",
    tip: "The spine runs from the neck base through the back to the tail. Look for imbalance, scoliosis, or pain on flexion/extension. Spinal issues affect posture, balance, and overall mobility.",
    watch: ["Wobble or instability when standing", "Visible curvature (scoliosis)", "Pain on touch or manipulation", "Uneven weight distribution", "Difficulty walking straight", "Tail held at abnormal angle"],
    x: 56,
    y: 37,
  },
  {
    key: "keel",
    name: "Keel",
    tip: "The keel bone (breastbone) is a key indicator of body condition and muscle health. Palpate for tenderness or callus; ensure body condition is adequate. A prominent keel may indicate malnutrition.",
    watch: ["Callus or thickening on keel", "Bruising or discoloration", "Thin body condition (prominent keel)", "Tenderness on palpation", "Muscle wasting on breast", "Abnormal posture to protect keel"],
    x: 37,
    y: 62,
  },
  {
    key: "leg",
    name: "Leg",
    tip: "Legs and feet are critical for mobility and balance. Observe weight-bearing, tarsal alignment, and footpad lesions. Common issues include bumblefoot, sprains, fractures, and scaly leg mites.",
    watch: ["Limping or favoring one leg", "Favoring one side or toe-touching", "Sores, swelling, or scabs on footpads", "Swollen hock or tarsal joints", "Abnormal leg angle or rotation", "Heat or pain in leg area"],
    x: 40,
    y: 78,
  },
];

const CASES = [
  { id: 1, title: "Wing droop", cue: "Primary feathers hang lower on one side.", normal: "Symmetric wing carriage.", issue: "One wing consistently lower." },
  { id: 2, title: "Limping", cue: "Shorter stance cycle on affected leg.", normal: "Even steps.", issue: "Skipping or toe‑touch only." },
  { id: 3, title: "Imbalance", cue: "Body sway while standing.", normal: "Stable center of mass.", issue: "Sways or leans." },
  { id: 4, title: "Keel bruise", cue: "Tenderness on palpation.", normal: "No reaction.", issue: "Withdraws when touched." },
  { id: 5, title: "Eye discharge", cue: "Wet or crusted eyelids.", normal: "Clear, bright eye.", issue: "Cloudy/tearing." },
  { id: 6, title: "Muscle atrophy", cue: "One thigh feels smaller.", normal: "Equal bulk.", issue: "Thin/soft on one side." },
];

const QUIZ = [
  { q: "Wing droop after exertion most likely indicates:", options: ["Dehydration", "Wing strain or joint injury", "Normal molt"], a: 1 },
  { q: "Toe‑touching with a shorter stance on one side suggests:", options: ["Leg pain / tarsal sprain", "Healthy gait", "Respiratory issue"], a: 0 },
  { q: "Local warmth and swelling over the keel are signs of:", options: ["Keel bruise / inflammation", "Feather mites", "Normal growth"], a: 0 },
  { q: "Sudden head tilt with imbalance may indicate:", options: ["Inner ear / neurologic issue", "Normal alertness", "Crop impaction"], a: 0 },
  { q: "Visible atrophy of one thigh compared to the other points to:", options: ["Muscle wasting from nerve or disuse", "Hydration", "Overfeeding"], a: 0 },
];

const GLOSSARY: { term: string; def: string }[] = [
  // From Article 1: Understanding Rooster Anatomy
  { term: "Keypoints", def: "The 17 specific anatomical points that RoosterScan detects on a rooster for pose analysis." },
  { term: "Pose Estimation", def: "AI technique that identifies the position of body parts in an image to assess posture and health." },
  { term: "Symmetry", def: "Balance between left and right body parts; asymmetry often indicates injury or illness." },
  { term: "Keel Bone", def: "The breastbone (chest point #5); important for assessing body condition and muscle health." },
  { term: "Wing Droop", def: "One wing hanging lower than the other, indicating potential wing injury or muscle weakness." },
  { term: "Gait", def: "Pattern of walking; analyzed through leg keypoints to detect limping or balance issues." },
  
  // From Article 2: Photography
  { term: "Profile View", def: "Side view of the rooster; optimal camera angle for AI pose detection (highest accuracy)." },
  { term: "Framing", def: "Positioning the rooster in the photo with full body visible and proper margins around edges." },
  { term: "Resolution", def: "Image quality measured in pixels; higher resolution (1080p+) improves AI detection accuracy." },
  { term: "Diffused Light", def: "Soft, even lighting without harsh shadows; ideal for rooster photography (overcast days or indirect sun)." },
  
  // From Article 3: Health Signs
  { term: "Comb", def: "Fleshy crest on top of head (keypoint #3); color and texture indicate overall health status." },
  { term: "Wattles", def: "Fleshy lobes hanging from throat; should be vibrant red and warm to touch when healthy." },
  { term: "Molting", def: "Natural seasonal feather loss and regrowth; roosters may appear scruffy and less active during this period." },
  { term: "Bumblefoot", def: "Bacterial infection of the foot pad causing swelling and limping; detected through altered weight distribution." },
  { term: "Palpation", def: "Physical examination by touch to check for tenderness, swelling, or abnormalities in muscles and bones." },
  
  // From Article 4: AI Technology
  { term: "YOLO", def: "You Only Look Once - fast AI detection model used by RoosterScan to identify roosters and keypoints." },
  { term: "Confidence Score", def: "Percentage (0-100%) indicating how certain the AI is about a detection; higher scores mean more reliable results." },
  { term: "Sequential Validation", def: "RoosterScan's two-stage process: pose detection first, then health classification only if quality is sufficient." },
  { term: "Transfer Learning", def: "Training technique where RoosterScan builds on existing animal pose models, improving accuracy with less data." },
  { term: "Quality Gates", def: "Minimum thresholds (65% confidence) that detections must meet before proceeding to health assessment." },
  
  // From Article 5: Confidence Scores
  { term: "Threshold", def: "Minimum confidence level (65%) required for AI to proceed with health classification." },
  { term: "Image Preprocessing", def: "AI adjustments to brightness, contrast, and size before analysis to improve detection accuracy." },
  { term: "Keypoint Confidence", def: "Individual confidence score for each of the 17 anatomical points detected by the AI." },
  
  // General Health Terms
  { term: "Atrophy", def: "Muscle wasting from injury, nerve damage, or disuse; visible as reduced muscle mass in affected area." },
  { term: "ROM", def: "Range of Motion - how far a joint can move; compared between left and right sides to detect injuries." },
  { term: "Tarsus", def: "Lower leg segment between knee and foot; common site for sprains, fractures, or bumblefoot." },
  { term: "Primary Feathers", def: "Long outer wing feathers (keypoints 10-11); their position indicates wing health and carriage." },
  { term: "Scoliosis", def: "Abnormal spinal curvature causing body imbalance; detected through misaligned back keypoints (4-6-7)." },
];

const HOTSPOT_VERSION = "v2"; // Increment this when DEFAULT_PARTS changes

export default function Learn() {
  const [parts, setParts] = useState<Hotspot[]>(() => {
    const saved = localStorage.getItem("rx_hotspots");
    const savedVersion = localStorage.getItem("rx_hotspots_version");
    
    // If version doesn't match, use new DEFAULT_PARTS
    if (savedVersion !== HOTSPOT_VERSION) {
      localStorage.setItem("rx_hotspots_version", HOTSPOT_VERSION);
      localStorage.setItem("rx_hotspots", JSON.stringify(DEFAULT_PARTS));
      return DEFAULT_PARTS;
    }
    
    try {
      return saved ? JSON.parse(saved) : DEFAULT_PARTS;
    } catch {
      return DEFAULT_PARTS;
    }
  });
  const [active, setActive] = useState<Hotspot["key"]>("wing");
  const [answers, setAnswers] = useState<number[]>(Array(QUIZ.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [educationalContent, setEducationalContent] = useState<EducationalContent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load educational content from database
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const content = await fetchEducationalContent();
        setEducationalContent(content);
      } catch (error) {
        toast.error('Failed to load educational content');
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const score = useMemo(
    () => answers.filter((v, i) => v === QUIZ[i].a).length,
    [answers],
  );
  const filteredGlossary = useMemo(
    () => GLOSSARY.filter((g) => g.term.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const filteredContent = useMemo(() => {
    return educationalContent.filter(content => 
      selectedCategory === 'all' || content.category === selectedCategory
    );
  }, [educationalContent, selectedCategory]);

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(educationalContent.map(c => c.category))];
    return cats;
  }, [educationalContent]);

  const activePart = parts.find((p) => p.key === active) ?? parts[0];

  const startDrag = (key: Hotspot["key"], e: React.PointerEvent) => {
    if (!editing) {
      setActive(key);
      return;
    }
    e.preventDefault();
    const onMove = (ev: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      const clamp = (n: number) => Math.max(2, Math.min(98, n));
      setParts((prev) => prev.map((p) => (p.key === key ? { ...p, x: clamp(x), y: clamp(y) } : p)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const saveHotspots = () => {
    localStorage.setItem("rx_hotspots", JSON.stringify(parts));
    setEditing(false);
  };
  const resetHotspots = () => {
    localStorage.removeItem("rx_hotspots");
    setParts(DEFAULT_PARTS);
    setActive("wing");
    setEditing(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Educational Hub</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Tap the hotspots, review quick cases, take a 5‑question quiz, and browse the glossary.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base sm:text-lg">Anatomy Hotspots</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="text-xs">
                    Edit hotspots
                  </Button>
                ) : (
                  <>
                    <Button size="sm" onClick={saveHotspots} className="text-xs">Save</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button variant="secondary" size="sm" onClick={resetHotspots} className="text-xs">
                      Reset
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={containerRef} className="relative overflow-hidden rounded-lg border select-none">
              <img src={IMAGE_URL} alt="Gamefowl side profile" className="h-full w-full object-cover opacity-90" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
              {parts.map((p) => (
                <button
                  key={p.key}
                  onPointerDown={(e) => startDrag(p.key, e)}
                  onClick={() => !editing && setActive(p.key)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 grid place-items-center rounded-full border transition-colors ${editing ? "backdrop-blur bg-white/40 hover:bg-white/60" : "backdrop-blur bg-white/20 hover:bg-white/30"}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: editing ? 28 : 24, height: editing ? 28 : 24 }}
                  aria-label={p.name}
                >
                  <span
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: active === p.key ? "#ef4444" : "#f59e0b" }}
                  />
                </button>
              ))}
            </div>
            {editing && (
              <p className="mt-2 text-xs text-muted-foreground">Drag the dots to align. Save to persist (stored locally).</p>
            )}
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base fade-in">{activePart.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 overflow-y-auto max-h-[600px]">
            <p className="text-xs text-muted-foreground leading-relaxed fade-in">{activePart.tip}</p>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground fade-in">Watch For:</p>
              {activePart.watch.map((w, index) => (
                <div key={w} className="flex items-start gap-2 rounded-md border px-2.5 py-1.5 bg-card text-xs stagger-item">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Educational Content from Database */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Educational Content</h2>
            <Badge variant="secondary">{filteredContent.length} items</Badge>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category.replace('_', ' ')}
              </Button>
            ))}
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading educational content...</p>
            </div>
          ) : filteredContent.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map((content) => (
                <Card 
                  key={content.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = `/learn/article/${content.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2">{content.title}</CardTitle>
                      <Badge variant="outline" className="ml-2 shrink-0 capitalize">
                        {content.content_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {content.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span className="capitalize">{content.difficulty_level}</span>
                      {content.duration_minutes && (
                        <span>{content.duration_minutes} min</span>
                      )}
                      <span>{content.view_count} views</span>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {content.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      Read Article
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No educational content found for this category.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Content will be loaded from the database once available.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Quick Cases</h2>
            <Badge variant="secondary" className="text-xs">6 examples</Badge>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CASES.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-base">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <p className="text-muted-foreground">Cue: {c.cue}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 bg-green-500/5">
                    <p className="text-xs text-muted-foreground mb-1">Normal</p>
                    <p>{c.normal}</p>
                  </div>
                  <div className="rounded-lg border p-3 bg-rose-500/5">
                    <p className="text-xs text-muted-foreground mb-1">Issue</p>
                    <p>{c.issue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Quick Quiz</h2>
          {submitted && <Badge className="text-xs">{score}/{QUIZ.length}</Badge>}
        </div>
        <div className="grid gap-4">
          {QUIZ.map((item, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-base">{i + 1}. {item.q}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {item.options.map((opt, j) => {
                  const chosen = answers[i] === j;
                  const correct = submitted && j === item.a;
                  const wrong = submitted && chosen && j !== item.a;
                  return (
                    <label key={j} className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer ${chosen ? "border-primary" : ""} ${correct ? "bg-green-500/10" : ""} ${wrong ? "bg-rose-500/10" : ""}`}>
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={answers[i] === j}
                        onChange={() => setAnswers((a) => a.map((v, idx) => (idx === i ? j : v)))}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          ))}
          <div className="flex gap-2">
            <Button onClick={() => setSubmitted(true)}>Submit</Button>
            <Button variant="outline" onClick={() => { setSubmitted(false); setAnswers(Array(QUIZ.length).fill(-1)); }}>Reset</Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Glossary</h2>
        <div className="max-w-sm">
          <Label htmlFor="search" className="sr-only">Search</Label>
          <Input id="search" placeholder="Search terms…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredGlossary.map((g) => (
            <div key={g.term} className="rounded-lg border p-3">
              <p className="font-medium">{g.term}</p>
              <p className="text-sm text-muted-foreground">{g.def}</p>
            </div>
          ))}
          {filteredGlossary.length === 0 && (
            <p className="text-sm text-muted-foreground">No matches.</p>
          )}
        </div>
      </div>
    </div>
  );
}
