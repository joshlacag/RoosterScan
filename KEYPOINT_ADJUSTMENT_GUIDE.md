# Keypoint Adjustment Guide

## Quick Reference for Positioning Keypoints

### Understanding the Coordinate System
- **X-axis (horizontal)**: 0.0 = left edge, 1.0 = right edge
- **Y-axis (vertical)**: 0.0 = top edge, 1.0 = bottom edge

### Visual Grid Reference
```
     0.0   0.25   0.5   0.75   1.0
0.0   +------+------+------+------+
      |                           |
0.25  +                           +
      |                           |
0.5   +         CENTER            +
      |                           |
0.75  +                           +
      |                           |
1.0   +------+------+------+------+
```

## Step-by-Step Adjustment Process

### 1. Start with the Head
Look at your rooster's head in the browser and adjust these first:

```typescript
{ name: 'beak_tip', x: 0.72, y: 0.42, label: 'Beak' },
{ name: 'eye', x: 0.68, y: 0.38, label: 'Eye' },
{ name: 'comb_top', x: 0.66, y: 0.30, label: 'Comb' },
```

**Tips:**
- If beak is too far left, INCREASE x value (e.g., 0.72 → 0.75)
- If beak is too far right, DECREASE x value (e.g., 0.72 → 0.68)
- If beak is too high, INCREASE y value (e.g., 0.42 → 0.45)
- If beak is too low, DECREASE y value (e.g., 0.42 → 0.38)

### 2. Adjust the Body
Once head is aligned, move to the body:

```typescript
{ name: 'neck_base', x: 0.58, y: 0.48, label: 'Neck' },
{ name: 'chest', x: 0.52, y: 0.58, label: 'Chest' },
{ name: 'back_mid', x: 0.48, y: 0.45, label: 'Back' },
{ name: 'tail_base', x: 0.35, y: 0.42, label: 'Tail' },
```

### 3. Fine-tune Wings
Adjust wing positions based on how they're folded:

```typescript
// Visible wing
{ name: 'left_wing_shoulder', x: 0.54, y: 0.50, label: 'L Wing' },
{ name: 'left_wing_elbow', x: 0.50, y: 0.56, label: '' },
{ name: 'left_wing_tip', x: 0.45, y: 0.64, label: '' },
```

### 4. Position the Legs
Adjust based on the rooster's stance:

```typescript
{ name: 'left_leg_joint', x: 0.50, y: 0.70, label: 'L Leg' },
{ name: 'left_foot', x: 0.48, y: 0.85, label: '' },
```

## Common Adjustments

### If rooster is facing RIGHT (like current image):
- Beak should have HIGH x value (0.70-0.80)
- Tail should have LOW x value (0.30-0.40)

### If rooster is facing LEFT:
- Beak should have LOW x value (0.20-0.30)
- Tail should have HIGH x value (0.60-0.70)

### If rooster is in CENTER:
- Most keypoints should be around x: 0.40-0.60

### If rooster is STANDING UPRIGHT:
- Head keypoints: y around 0.30-0.40
- Body keypoints: y around 0.45-0.60
- Leg keypoints: y around 0.70-0.90

## Quick Adjustment Workflow

1. **Open the file**: `client/components/RoosterPoseVisualization.tsx`
2. **Find the keypoint** you want to adjust (lines 20-46)
3. **Change the x or y value** by small increments (0.05 at a time)
4. **Save the file** (Ctrl+S)
5. **Refresh browser** to see changes
6. **Repeat** until aligned

## Example Adjustment

**Before:**
```typescript
{ name: 'beak_tip', x: 0.72, y: 0.42, label: 'Beak' },
```

**If beak needs to move right and down:**
```typescript
{ name: 'beak_tip', x: 0.77, y: 0.47, label: 'Beak' },
//                      ↑ +0.05      ↑ +0.05
```

## Pro Tips

1. **Adjust in small increments** - 0.02 to 0.05 at a time
2. **Start with major keypoints** - Head first, then body, then details
3. **Use the active keypoint highlight** - The animation cycles through keypoints every 2 seconds
4. **Check the skeleton connections** - Lines should follow the rooster's body structure
5. **Test with different roosters** - Adjust for a "typical" rooster pose

## Need Help?

If keypoints are way off:
1. Check if the rooster image loaded correctly
2. Verify the rooster is facing the direction you expect
3. Start fresh with the head position and work backwards

Remember: These are just starting positions. Every rooster image will need slight adjustments!
