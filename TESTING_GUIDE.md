# RoosterScan Testing Guide

## Overview
This guide provides comprehensive testing instructions for the RoosterScan AI-powered rooster injury detection system. Follow these steps to verify all features are working correctly.

## Prerequisites
- Development server running on port 8082
- Camera access enabled in browser
- Modern browser with WebRTC support (Chrome, Firefox, Safari)
- Good lighting conditions for optimal pose detection

## Testing Phases

### Phase 1: Basic System Verification

#### 1.1 Application Launch
**Test:** Open browser preview at http://localhost:8082
**Expected:**
- Application loads without errors
- UI renders correctly with modern, responsive design
- No console errors in browser developer tools
- Authentication system initializes

#### 1.2 Authentication Flow
**Test:** User login/registration
**Expected:**
- Supabase authentication works
- JWT tokens are properly managed
- User session persists across page refreshes
- Secure logout functionality

### Phase 2: Camera and Video Processing

#### 2.1 Camera Access
**Test:** Enable camera permissions
**Expected:**
- Browser prompts for camera access
- Live video stream displays in interface
- Video controls (start/stop/pause) function
- Frame rate maintains ~30fps

#### 2.2 Video Stream Quality
**Test:** Video capture under different conditions
**Expected:**
- Clear video quality in good lighting
- Automatic exposure adjustment
- Stable frame rate
- No significant lag or stuttering

### Phase 3: AI Pose Estimation

#### 3.1 Pose Detection Initialization
**Test:** AI model loading
**Expected:**
- TensorFlow.js models load successfully
- "Model loaded" event fires
- No model loading errors in console
- Processing pipeline initializes

#### 3.2 Real-time Pose Detection
**Test:** Point camera at rooster or rooster image
**Expected:**
- Keypoints detected and displayed as overlay
- Skeleton visualization appears
- Confidence scores shown for each keypoint
- Real-time updates at ~30fps
- Keypoints include:
  - Head region (beak, eyes, comb, wattles)
  - Body (neck, chest, back, tail)
  - Wings (shoulders, elbows, tips)
  - Legs (hips, knees, ankles, feet)

#### 3.3 Pose Tracking Stability
**Test:** Move rooster/camera slowly
**Expected:**
- Smooth keypoint tracking
- Minimal jitter in pose estimation
- Consistent detection across frames
- Graceful handling of partial occlusion

### Phase 4: Injury Detection System

#### 4.1 Rule-Based Detection
**Test:** Present scenarios that trigger injury detection
**Expected:**
- Wing asymmetry detection (>15% difference)
- Leg length asymmetry detection (>10% difference)
- Drooping wing detection (angle < -30°)
- Low confidence keypoint analysis
- Gait abnormality detection (requires movement)

#### 4.2 Injury Classification
**Test:** Verify injury types are properly classified
**Expected:**
- Wing fractures detected and categorized
- Leg fractures identified
- Spinal misalignments flagged
- Muscle strains recognized
- Gait abnormalities tracked
- Severity levels assigned (Mild/Moderate/Severe)

#### 4.3 Confidence Scoring
**Test:** Injury detection confidence levels
**Expected:**
- Confidence scores between 0-1
- Higher confidence for obvious injuries
- Threshold filtering (default 0.6)
- Confidence displayed in UI

### Phase 5: AR Overlay System

#### 5.1 3D Model Rendering
**Test:** AR anatomical overlay
**Expected:**
- Three.js 3D models load correctly
- Anatomical model overlays on detected pose
- Proper scaling and positioning
- Smooth rendering without lag

#### 5.2 Injury Visualization
**Test:** Injury highlighting in AR
**Expected:**
- Detected injuries highlighted on 3D model
- Color coding by severity (red=severe, yellow=moderate, green=mild)
- Bounding boxes around injury locations
- Interactive injury information display

#### 5.3 AR Performance
**Test:** AR overlay performance
**Expected:**
- Stable 3D rendering
- Proper depth perception
- No significant performance impact
- Responsive to pose changes

### Phase 6: Analytics and Reporting

#### 6.1 Session Management
**Test:** Analysis session tracking
**Expected:**
- Sessions start/stop correctly
- Real-time analysis data captured
- Session metadata recorded
- Progress tracking functional

#### 6.2 Report Generation
**Test:** Injury report creation
**Expected:**
- Comprehensive injury reports generated
- PDF export functionality
- Historical data tracking
- Injury progression analysis

#### 6.3 Data Persistence
**Test:** Data storage and retrieval
**Expected:**
- Scan results saved to database
- User data properly associated
- Historical scans accessible
- Data synchronization with backend

### Phase 7: Performance Testing

#### 7.1 Real-time Performance
**Test:** System performance under load
**Expected:**
- Consistent 30fps processing
- Memory usage remains stable
- No memory leaks over extended use
- CPU usage reasonable (<50% on modern hardware)

#### 7.2 Model Inference Speed
**Test:** AI processing speed
**Expected:**
- Pose detection: <50ms per frame
- Injury analysis: <100ms per frame
- Total pipeline latency: <150ms
- No frame dropping

### Phase 8: Error Handling

#### 8.1 Camera Errors
**Test:** Camera access denied or unavailable
**Expected:**
- Graceful error messages
- Fallback to file upload option
- Clear user instructions
- No application crashes

#### 8.2 Model Loading Errors
**Test:** Network issues during model loading
**Expected:**
- Retry mechanisms
- Loading progress indicators
- Fallback error states
- User-friendly error messages

#### 8.3 API Failures
**Test:** Backend connectivity issues
**Expected:**
- Offline mode functionality
- Data queuing for later sync
- Connection retry logic
- Status indicators

## Expected Behaviors by Feature

### Injury Detection Scenarios

#### Wing Injuries
- **Asymmetry:** >15% length difference triggers detection
- **Drooping:** Wing angle <-30° indicates potential fracture
- **Low Confidence:** <40% keypoint confidence suggests injury

#### Leg Injuries
- **Length Difference:** >10% asymmetry flags potential fracture
- **Abnormal Angles:** Leg angles outside 90-180° range
- **Gait Issues:** Movement asymmetry >20% indicates limping

#### Spinal Issues
- **Curvature:** >30% spine curvature abnormality
- **Alignment:** Misaligned vertebral keypoints
- **Posture:** Abnormal head/neck positioning

#### Muscle Strains
- **Instability:** >40% of keypoints with low confidence
- **Trembling:** Rapid keypoint position changes
- **Weakness:** Reduced movement range

### Performance Benchmarks

#### Processing Speed
- **Pose Detection:** 20-30 FPS
- **Injury Analysis:** 10-15 FPS
- **AR Rendering:** 30-60 FPS
- **Total Latency:** <200ms end-to-end

#### Accuracy Expectations
- **Pose Detection:** >85% keypoint accuracy
- **Injury Detection:** >75% true positive rate
- **False Positives:** <20% of detections
- **Confidence Calibration:** Well-calibrated probability scores

## Troubleshooting Common Issues

### Camera Not Working
1. Check browser permissions
2. Verify camera hardware
3. Try different browsers
4. Check for conflicting applications

### Poor Pose Detection
1. Improve lighting conditions
2. Ensure rooster is fully visible
3. Reduce background clutter
4. Check camera focus

### Slow Performance
1. Close other browser tabs
2. Check system resources
3. Reduce video resolution
4. Update browser/drivers

### Injury Detection Issues
1. Verify pose quality first
2. Check confidence thresholds
3. Ensure proper rooster positioning
4. Review detection parameters

## Success Criteria

### Functional Requirements
- ✅ All core features operational
- ✅ Real-time processing achieved
- ✅ Accurate injury detection
- ✅ Stable AR visualization
- ✅ Reliable data persistence

### Performance Requirements
- ✅ <200ms total processing latency
- ✅ >20 FPS pose detection
- ✅ <2GB memory usage
- ✅ Stable operation for >30 minutes

### User Experience Requirements
- ✅ Intuitive interface
- ✅ Clear visual feedback
- ✅ Responsive controls
- ✅ Helpful error messages
- ✅ Professional appearance

## Next Steps After Testing

1. **Document Issues:** Record any bugs or performance problems
2. **Performance Optimization:** Address any latency or accuracy issues
3. **Educational Modules:** Implement anatomy learning features
4. **Advanced Analytics:** Add trend analysis and insights
5. **Mobile Optimization:** Ensure mobile device compatibility
6. **Production Deployment:** Prepare for live environment

## Testing Checklist

- [ ] Application launches successfully
- [ ] Authentication system works
- [ ] Camera access granted and functional
- [ ] Pose detection initializes
- [ ] Real-time keypoint tracking
- [ ] Injury detection triggers appropriately
- [ ] AR overlay renders correctly
- [ ] Reports generate successfully
- [ ] Data persists correctly
- [ ] Performance meets benchmarks
- [ ] Error handling works gracefully
- [ ] All features tested end-to-end

---

**Note:** This testing guide should be executed in a systematic manner. Document any deviations from expected behavior and performance metrics for further optimization.
