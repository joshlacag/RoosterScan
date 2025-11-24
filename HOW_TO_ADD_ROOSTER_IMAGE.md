# How to Add Your Own Rooster Image

The homepage now displays a real rooster image with animated AI keypoint detection overlay!

## Current Setup
- Currently using a placeholder rooster image from Unsplash
- Image URL is in: `client/components/RoosterPoseVisualization.tsx` (line 43)

## Option 1: Use Your Own Image URL
1. Upload your rooster image to any image hosting service (Imgur, Cloudinary, etc.)
2. Open `client/components/RoosterPoseVisualization.tsx`
3. Find line 43: `img.src = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop';`
4. Replace the URL with your image URL

## Option 2: Use a Local Image
1. Create a folder: `client/public/images/`
2. Add your rooster image (e.g., `rooster.jpg`)
3. Open `client/components/RoosterPoseVisualization.tsx`
4. Change line 43 to: `img.src = '/images/rooster.jpg';`
5. Remove line 44: `img.crossOrigin = 'anonymous';` (not needed for local images)

## Best Image Specifications
- **Orientation**: Side view of rooster (profile shot)
- **Resolution**: 800x600 or higher
- **Format**: JPG or PNG
- **Background**: Plain or contrasting background works best
- **Lighting**: Good lighting to see rooster details
- **Pose**: Standing naturally, showing full body

## Tips
- The image will be slightly darkened (70% opacity) to make the animated keypoints more visible
- The keypoint positions are normalized (0-1 coordinates) so they work with any image size
- If the image fails to load, the system gracefully falls back to overlay-only mode

## Example Code Location
File: `client/components/RoosterPoseVisualization.tsx`
Lines: 40-52

```typescript
useEffect(() => {
  const img = new Image();
  // Replace this URL with your own rooster image
  img.src = 'YOUR_IMAGE_URL_HERE';
  img.crossOrigin = 'anonymous'; // Remove if using local image
  img.onload = () => setRoosterImage(img);
  
  img.onerror = () => {
    console.log('Rooster image failed to load, using overlay only');
    setRoosterImage(null);
  };
}, []);
```

Your animated keypoint visualization will automatically overlay on whatever image you provide!
