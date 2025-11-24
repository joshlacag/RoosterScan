# Duration Column Fix ✅

## 🔧 ISSUE

**Problem:** Duration column showed "—" for all pose analysis scans

**Why:** Pose analysis uses static images (not videos), so duration = 0, which displayed as "—"

---

## ✨ SOLUTION

**Changed display logic:**

### **Before:**
```
Duration: 0 → Shows "—"
```

### **After:**
```
Duration: 0 → Shows "Instant" (for image scans)
Duration: 5 → Shows "5s" (for video scans)
Duration: null → Shows "—" (for missing data)
```

---

## 📊 NEW DISPLAY

```
┌──────────────┬─────────────┬──────────┐
│ Date         │ Rooster     │ Duration │
├──────────────┼─────────────┼──────────┤
│ Oct 13, 7:10 │ Red Thunder │ Instant  │ ← FIXED!
│ Oct 12, 6:30 │ Lady Phoenix│ Instant  │ ← FIXED!
│ Oct 10, 3:15 │ Golden Boy  │ 15s      │ ← Video scan
└──────────────┴─────────────┴──────────┘
```

---

## 🎯 LOGIC

```typescript
{scan.duration && scan.duration > 0 ? 
  `${scan.duration}s` :           // Show seconds if > 0
  scan.scanType === 'live_video' || scan.scanType === 'recorded_video' ? 
    "—" :                          // Show dash for videos with no duration
    "Instant"                      // Show "Instant" for image scans
}
```

---

## ✅ RESULT

- ✅ Image scans (Pose Analysis) → "Instant"
- ✅ Video scans with duration → "5s", "15s", etc.
- ✅ Video scans without duration → "—"
- ✅ More informative display!

---

**Refresh to see "Instant" instead of "—"! 🎉**
