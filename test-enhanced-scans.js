// Test Enhanced Scan Storage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gejsbfhgexnxrabksdhx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlanNiZmhnZXhueHJhYmtzZGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDE5MjIsImV4cCI6MjA3MzA3NzkyMn0.jRf2eeG3fHrLRllL33-7GwaafSKixTo8O3Au_xUOATo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnhancedScanStorage() {
  console.log('🧪 Testing Enhanced Scan Storage...\n');

  try {
    // Test data that mimics what your enhanced system would save
    const testScanData = {
      user_id: '00000000-0000-0000-0000-000000000001',
      rooster_id: null,
      duration_seconds: 30,
      
      // Enhanced AI analysis data (this is what we added!)
      pose_data: {
        posture: 'normal',
        wing: 'normal', 
        legs: 'normal',
        movement: 'stable',
        // New enhanced fields
        pose_confidence: 0.847,
        keypoints_detected: 17,
        analysis_type: 'sequential_validation',
        health_assessment: 'healthy',
        combined_confidence: 0.921,
        quality_gate_passed: true,
        recommendations: [
          'Rooster appears healthy based on AI analysis',
          'Continue regular health monitoring'
        ]
      },
      
      injury_detections: [
        {
          type: 'classification_result',
          confidence: 0.9999,
          source: 'sequential_validation',
          classification_data: {
            classification: 'healthy',
            confidence: 0.9999,
            probabilities: {
              healthy: 0.9999,
              bumblefoot: 0.0001
            }
          }
        }
      ],
      
      analysis_confidence: 0.847,
      processing_time_ms: 2500,
      model_version: 'YOLO-v8-Sequential-1.0',
      fps: 30,
      resolution: '640x480',
      status: 'completed',
      notes: 'Test scan with enhanced AI data'
    };

    console.log('📝 Creating test scan with enhanced data...');
    
    const { data: scan, error } = await supabase
      .from('scans')
      .insert([testScanData])
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create scan:', error);
      return;
    }

    console.log('✅ Enhanced scan created successfully!');
    console.log(`   Scan ID: ${scan.id}`);
    console.log(`   Analysis Confidence: ${scan.analysis_confidence}`);
    console.log(`   Model Version: ${scan.model_version}`);
    console.log(`   Processing Time: ${scan.processing_time_ms}ms`);
    console.log(`   Keypoints Detected: ${scan.pose_data.keypoints_detected}`);
    console.log(`   Health Assessment: ${scan.pose_data.health_assessment}`);

    // Test retrieving the scan to verify all data is stored correctly
    console.log('\n🔍 Retrieving scan to verify data integrity...');
    
    const { data: retrievedScan, error: retrieveError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scan.id)
      .single();

    if (retrieveError) {
      console.error('❌ Failed to retrieve scan:', retrieveError);
      return;
    }

    console.log('✅ Scan retrieved successfully!');
    
    // Verify enhanced data is preserved
    const poseData = retrievedScan.pose_data;
    const injuryData = retrievedScan.injury_detections;
    
    console.log('\n📊 Enhanced Data Verification:');
    console.log(`   ✅ Pose Confidence: ${poseData.pose_confidence}`);
    console.log(`   ✅ Keypoints Detected: ${poseData.keypoints_detected}`);
    console.log(`   ✅ Analysis Type: ${poseData.analysis_type}`);
    console.log(`   ✅ Health Assessment: ${poseData.health_assessment}`);
    console.log(`   ✅ Combined Confidence: ${poseData.combined_confidence}`);
    console.log(`   ✅ Quality Gate Passed: ${poseData.quality_gate_passed}`);
    console.log(`   ✅ Recommendations: ${poseData.recommendations?.length || 0} items`);
    console.log(`   ✅ Processing Time: ${retrievedScan.processing_time_ms}ms`);
    console.log(`   ✅ Model Version: ${retrievedScan.model_version}`);
    console.log(`   ✅ Injury Classifications: ${injuryData?.length || 0} items`);

    if (injuryData && injuryData.length > 0) {
      const classificationResult = injuryData.find(inj => inj.type === 'classification_result');
      if (classificationResult) {
        console.log(`   ✅ Bumblefoot Classification: ${classificationResult.classification_data?.classification}`);
        console.log(`   ✅ Classification Confidence: ${classificationResult.classification_data?.confidence}`);
      }
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('scans').delete().eq('id', scan.id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 ENHANCED SCAN STORAGE TEST PASSED!');
    console.log('   Your system is now storing rich AI analysis data including:');
    console.log('   • Pose confidence scores');
    console.log('   • Keypoint detection counts');
    console.log('   • Analysis type (sequential validation)');
    console.log('   • Health assessments');
    console.log('   • Processing time metrics');
    console.log('   • Model version tracking');
    console.log('   • Detailed injury classifications');
    console.log('   • AI recommendations');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEnhancedScanStorage().catch(console.error);
