import { useEffect, useRef, useState } from 'react';

// ============================================================================
// KEYPOINT POSITION ADJUSTMENT GUIDE
// ============================================================================
// Coordinates are normalized from 0.0 to 1.0
// x: 0.0 = left edge, 1.0 = right edge
// y: 0.0 = top edge, 1.0 = bottom edge
//
// HOW TO ADJUST:
// 1. Look at your rooster image in the browser
// 2. Estimate where each body part is located
// 3. Adjust the x and y values below
// 4. Save and refresh to see changes
// 5. Repeat until aligned
//
// TIP: Start with the head (beak, eye, comb) and work backwards to the tail
// ============================================================================

const ROOSTER_KEYPOINTS = [
  // HEAD REGION - From actual annotated data (IMG_4166_frame_0008)
  // Original image: 1200x675, normalized to 0-1
  { name: 'beak_tip', x: 0.534, y: 0.385, label: 'Beak' },      // 641/1200, 260/675
  { name: 'eye', x: 0.519, y: 0.369, label: 'Eye' },            // 623/1200, 249/675
  { name: 'comb_top', x: 0.529, y: 0.357, label: 'Comb' },      // 635/1200, 241/675
  
  // BODY REGION - Exact positions from annotation
  { name: 'neck_base', x: 0.523, y: 0.467, label: 'Neck' },     // 627/1200, 315/675
  { name: 'chest', x: 0.517, y: 0.547, label: 'Chest' },        // 620/1200, 369/675
  { name: 'back_mid', x: 0.443, y: 0.517, label: 'Back' },      // 532/1200, 349/675
  { name: 'tail_base', x: 0.409, y: 0.547, label: 'Tail' },     // 491/1200, 369/675
  
  // LEFT WING - From annotation data
  { name: 'left_wing_shoulder', x: 0.472, y: 0.513, label: 'L Wing' },  // 566/1200, 346/675
  { name: 'left_wing_elbow', x: 0.453, y: 0.560, label: '' },           // 543/1200, 378/675
  { name: 'left_wing_tip', x: 0.418, y: 0.658, label: '' },             // 501/1200, 444/675
  
  // RIGHT WING - From annotation data
  { name: 'right_wing_shoulder', x: 0.502, y: 0.508, label: 'R Wing' }, // 602/1200, 343/675
  { name: 'right_wing_elbow', x: 0.511, y: 0.566, label: '' },          // 613/1200, 382/675
  { name: 'right_wing_tip', x: 0.445, y: 0.662, label: '' },            // 534/1200, 447/675
  
  // LEGS - From annotation data
  { name: 'left_leg_joint', x: 0.449, y: 0.677, label: 'L Leg' },  // 539/1200, 457/675
  { name: 'left_foot', x: 0.449, y: 0.751, label: '' },             // 539/1200, 507/675
  { name: 'right_leg_joint', x: 0.463, y: 0.701, label: 'R Leg' }, // 555/1200, 473/675
  { name: 'right_foot', x: 0.469, y: 0.782, label: '' },            // 563/1200, 528/675
];

// Skeleton connections (which keypoints to connect)
const SKELETON_CONNECTIONS = [
  [0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [5, 6], // Head to tail
  [3, 7], [7, 8], [8, 9], // Left wing
  [3, 10], [10, 11], [11, 12], // Right wing
  [4, 13], [13, 14], // Left leg
  [4, 15], [15, 16], // Right leg
];

export default function RoosterPoseVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeKeypoint, setActiveKeypoint] = useState<number>(-1);
  const [roosterImage, setRoosterImage] = useState<HTMLImageElement | null>(null);
  const animationRef = useRef<number>();

  // Load rooster image
  useEffect(() => {
    const img = new Image();
    // Using placeholder rooster image
    img.src = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop';
    img.crossOrigin = 'anonymous';
    img.onload = () => setRoosterImage(img);
    
    // Fallback: if image fails to load, continue without it
    img.onerror = () => {
      console.log('Rooster image failed to load, using overlay only');
      setRoosterImage(null);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw rooster image if loaded
      if (roosterImage) {
        // Draw image to fit canvas while maintaining aspect ratio
        const imgAspect = roosterImage.width / roosterImage.height;
        const canvasAspect = width / height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspect > canvasAspect) {
          // Image is wider
          drawHeight = height;
          drawWidth = height * imgAspect;
          offsetX = (width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller
          drawWidth = width;
          drawHeight = width / imgAspect;
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
        }
        
        // Apply slight darkening for better keypoint visibility
        ctx.globalAlpha = 0.7;
        ctx.drawImage(roosterImage, offsetX, offsetY, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0;
      }

      // Keypoints and skeleton removed - showing clean rooster image only

      // Draw scanning line effect
      const scanY = (Math.sin(frame * 0.03) * 0.5 + 0.5) * height;
      const scanGradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanGradient.addColorStop(0, 'rgba(244, 63, 94, 0)');
      scanGradient.addColorStop(0.5, 'rgba(244, 63, 94, 0.2)');
      scanGradient.addColorStop(1, 'rgba(244, 63, 94, 0)');
      
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanY - 20, width, 40);

      frame++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cycle through keypoints
    const keypointInterval = setInterval(() => {
      setActiveKeypoint(prev => (prev + 1) % ROOSTER_KEYPOINTS.length);
    }, 2000);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearInterval(keypointInterval);
    };
  }, [activeKeypoint, roosterImage]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
      
      {/* Stats overlay */}
      <div className="absolute inset-x-0 bottom-0 flex justify-between text-xs text-white/70 px-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>17 Keypoints</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>AI Detection Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Sequential Validation</span>
        </div>
      </div>

    </div>
  );
}
